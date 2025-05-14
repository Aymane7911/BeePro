'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // Decode JWT manually
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));
      return decoded;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJWT(token);
      const currentTime = Date.now() / 1000;
      if (!decoded || decoded.exp < currentTime) {
        localStorage.removeItem('token');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await res.json();

      if (res.ok) {
        localStorage.setItem('token', result.token);
        router.push('/dashboard');
        setErrorMessage('');
      } else {
        setErrorMessage(result.message || 'Invalid login credentials. Try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <section className="relative min-h-screen w-full bg-gradient-to-r from-yellow-500 to-yellow-100 flex items-center justify-center text-black">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <Image
          src="/beelogo.png"
          alt="Honey Certify Logo"
          width={110}
          height={110}
          className="object-contain filter grayscale invert"
        />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-yellow-500 mb-6">
          Beekeeper Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={credentials.email}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          {errorMessage && (
            <div className="w-full bg-yellow-100 text-yellow-800 border border-yellow-400 p-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition"
          >
            Sign in
          </button>

          <p className="text-center text-sm mt-4 text-gray-600">
            Don’t have an account?{' '}
            <a href="/register" className="text-yellow-500 hover:underline">
              Register here
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
