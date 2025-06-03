import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs'; // Add password hashing

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstname, lastname, email, phonenumber, password } = body;

    if (!firstname || !lastname || !password || (!email && !phonenumber)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.beeusers.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phonenumber: phonenumber || undefined },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with that email or phone.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const confirmationToken = randomUUID();

    // Create new user
    const newUser = await prisma.beeusers.create({
      data: {
        firstname,
        lastname,
        email,
        phonenumber,
        password: hashedPassword,
        confirmationToken,
        isConfirmed: false,
      },
    });

    console.log('User registered:', newUser.id);

    // Send confirmation email
    if (email) {
      const confirmationLink = `${process.env.BASE_URL}/confirm?token=${confirmationToken}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Confirm your email',
        text: `Please click the following link to confirm your email: ${confirmationLink}`,
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'User registered successfully. Please check your email to confirm.' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error during registration.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
