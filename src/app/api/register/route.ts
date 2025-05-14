// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';  // Import nodemailer
import { randomUUID } from 'crypto'; // To generate confirmation token

const prisma = new PrismaClient();

// Create a transporter object using SMTP (example with Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Your email address
    pass: process.env.EMAIL_PASSWORD,  // Your email password or app-specific password
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstname, lastname, email, phonenumber, password } = body;

    if (!firstname || !lastname || !password || (!email && !phonenumber)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

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

    const confirmationToken = randomUUID(); // Generate unique token

    const newUser = await prisma.beeusers.create({
      data: {
        firstname,
        lastname,
        email,
        phonenumber,
        password, // You should hash this in real applications
        confirmationToken,
        isConfirmed: false,
      },
    });

    console.log('User registered:', newUser);

    // Send confirmation email with token
    const confirmationLink = `${process.env.BASE_URL}/confirm?token=${confirmationToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to: email, // List of recipients
      subject: 'Confirm your email',
      text: `Please click the following link to confirm your email: ${confirmationLink}`,
    };

    await transporter.sendMail(mailOptions);  // Send email

    return NextResponse.json(
      { success: true, message: 'User registered successfully. Please check your email to confirm.' },
      { status: 201 }
    );

  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error during registration.' },
      { status: 500 }
    );
  }
}
