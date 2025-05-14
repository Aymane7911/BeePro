import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  const { email, password } = await request.json();

  console.log('Login API called with email:', email); // Log the request data

  try {
    // Query the database for the user
    const result = await pool.query(
      'SELECT * FROM beeusers WHERE email = $1',
      [email]
    );

    console.log('Database query result:', result.rowCount); // Log the number of rows returned

    if (result.rowCount === 0) {
      console.log('User not found for email:', email);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = result.rows[0];
    console.log('User found:', user);

    if (!user.is_confirmed) {
      console.log('Email not confirmed for user:', email);
      return NextResponse.json({ message: 'Email not confirmed yet' }, { status: 403 });
    }

    if (user.password !== password) {
      console.log('Invalid password attempt for user:', email);
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    // Generate JWT token (no isProfileComplete flag)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    console.log('JWT token generated for user:', user.email);

    const response = NextResponse.json({ message: 'Login successful', token });

    // Set secure HTTP-only cookie for the token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    // Always redirect to dashboard
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/home`;
    console.log('Redirect URL:', redirectUrl);

    return NextResponse.json({ message: 'Login successful', token, redirectUrl });

  } catch (error: any) {
    console.error('Login error:', error.message, error.stack);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
