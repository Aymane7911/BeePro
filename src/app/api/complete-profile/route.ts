import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserIdFromToken } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Authenticate user from cookies
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';
    const userId = getUserIdFromToken(token);
    console.log('Decoded User ID:', userId);  // Log the decoded user ID

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const passportId = formData.get('passportId') as string;
    const phonenumber = formData.get('phonenumber') as string;
    const passportFile = formData.get('passportFile') as File;

    console.log('Form data received:', { passportId, phonenumber, passportFile });

    // Validate required fields
    if (!passportId || !phonenumber || !passportFile) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // Validate the phone number format (basic check)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phonenumber)) {
      return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 });
    }

    // Save the uploaded file to /public/uploads
    const bytes = await passportFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${passportFile.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadPath = path.join(uploadDir, filename);
    await writeFile(uploadPath, buffer);

    const filePath = `/uploads/${filename}`;

    // Update user profile in the database
    const updatedUser = await prisma.beeusers.update({
      where: { id: userId },
      data: {
        passportId,
        phonenumber,
        passportFile: filePath,
        isProfileComplete: true,
      },
    });

    // Regenerate JWT token with updated information
    const newToken = jwt.sign(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        isProfileComplete: updatedUser.isProfileComplete,
      },
      process.env.JWT_SECRET!,  // Ensure JWT_SECRET is correctly set in your environment
      { expiresIn: '1h' }
    );

    // Create response with new token
    const response = NextResponse.json({ message: 'Profile completed successfully', token: newToken });

    // Set new token in HTTP-only cookie with security flags
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Ensure cookies are secure in production
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    console.log('New token generated:', newToken);

    return response;
  } catch (error) {
    console.error('Error completing profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
