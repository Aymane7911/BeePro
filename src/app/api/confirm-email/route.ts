import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing confirmation token.' },
        { status: 400 }
      );
    }

    const user = await prisma.beeusers.findFirst({
      where: { confirmationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired confirmation token.' },
        { status: 404 }
      );
    }

    if (user.isConfirmed) {
      return NextResponse.json(
        { success: false, message: 'Email already confirmed.' },
        { status: 400 }
      );
    }

    await prisma.beeusers.update({
      where: { id: user.id }, // more stable than `email`
      data: {
        isConfirmed: true,
        confirmationToken: null,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Email confirmed successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CONFIRM_EMAIL_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong during confirmation.' },
      { status: 500 }
    );
  }
}
