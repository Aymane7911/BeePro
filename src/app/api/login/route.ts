import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Login API] Request received');

    const { email, password } = body;

    if (!email || !password) {
      console.log('[Login API] Missing email or password');
      return NextResponse.json(
        { message: 'Email and password are required' }, 
        { status: 400 }
      );
    }

    // Find user with Prisma (consistent with other APIs)
    const user = await prisma.beeusers.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('[Login API] User not found for email:', email);
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    if (!user.isConfirmed) {
      console.log('[Login API] Email not confirmed for user:', email);
      return NextResponse.json(
        { message: 'Email not confirmed yet' }, 
        { status: 403 }
      );
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('[Login API] Password mismatch for user:', email);
      return NextResponse.json(
        { message: 'Invalid credentials' }, 
        { status: 401 }
      );
    }

    console.log('[Login API] Password valid, generating JWT token');
    
    // Generate JWT token (same format as expected by authenticateRequest)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/home`;
    
    const response = NextResponse.json(
      {
        message: 'Login successful',
        token,
        redirectUrl,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours to match JWT expiry
      path: '/',
    });

    console.log('[Login API] Login successful for user:', user.id);
    return response;
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { message: 'Server error' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}