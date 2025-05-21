import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Login API] Request body:', body);

    const { email, password } = body;

    if (!email || !password) {
      console.log('[Login API] Missing email or password');
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    console.log('[Login API] Querying database for user:', email);
    const result = await pool.query('SELECT * FROM beeusers WHERE email = $1', [email]);
    console.log('[Login API] DB query completed, rows:', result.rowCount);

    if (result.rowCount === 0) {
      console.log('[Login API] User not found for email:', email);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    console.log('[Login API] User record:', user);

    if (!user.is_confirmed) {
      console.log('[Login API] Email not confirmed for user:', email);
      return NextResponse.json({ message: 'Email not confirmed yet' }, { status: 403 });
    }

    // You might want to hash password compare here instead of plain equality
    if (user.password !== password) {
      console.log('[Login API] Password mismatch for user:', email);
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    console.log('[Login API] Password valid, generating JWT token');
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    );

    console.log('[Login API] JWT token generated:', token);

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/home`;
    console.log('[Login API] Redirect URL:', redirectUrl);

    const response = NextResponse.json(
      {
        message: 'Login successful',
        token,
        redirectUrl,
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    });

    console.log('[Login API] Returning response with HTTP-only cookie set');
    return response;
  } catch (error: any) {
    console.error('[Login API] Unexpected error:', error.message, error.stack);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
