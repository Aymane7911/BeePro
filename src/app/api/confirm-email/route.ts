import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Confirmation token is required' },
        { status: 400 }
      );
    }

    // Find user by confirmation token
    const user = await prisma.beeusers.findFirst({
      where: { confirmationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 400 }
      );
    }

    if (user.isConfirmed) {
      return NextResponse.json(
        { message: 'Email already confirmed' },
        { status: 200 }
      );
    }

    // Confirm the user
    await prisma.beeusers.update({
      where: { id: user.id },
      data: {
        isConfirmed: true,
        confirmationToken: null, // Clear the token
      },
    });

    return NextResponse.json(
      { message: 'Email confirmed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error confirming email:', error);
    return NextResponse.json(
      { error: 'Failed to confirm email' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}