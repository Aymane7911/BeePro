'use client';

import { useState } from 'react';
import Image from 'next/image'; // Import Image component to use logo directly
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phonenumber: '',
    password: '',
    confirmPassword: '',
    useEmail: true,
  });

  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    setFormData(prev => ({ ...prev, useEmail: !prev.useEmail }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { firstname, lastname, email, phonenumber, password, useEmail } = formData;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname,
          lastname,
          password,
          ...(useEmail ? { email } : { phonenumber }),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        console.log('Registration successful:', data);
        router.push('/confirm-pending');
      } else {
        setError(data?.error || data?.message || 'Registration failed. Try again.');
        console.error('Registration failed:', data);

      }
    } catch (err) {
      console.error('Network or unexpected error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <section className="relative min-h-screen w-full bg-gradient-to-r from-yellow-500 to-yellow-100 flex items-center justify-center text-black">
      {/* Logo */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <Image
          src="/beelogo.png"
          alt="Honey Certify Logo"
          width={110}
          height={110}
           className="object-contain filter grayscale invert"
        />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mt-16">
        <h1 className="text-3xl font-bold text-center text-yellow-500 mb-6">
          Register as Beekeeper
        </h1>

        {/* Error message */}
        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="firstname"
            placeholder="First Name"
            value={formData.firstname}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          <input
            type="text"
            name="lastname"
            placeholder="Last Name"
            value={formData.lastname}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          {/* Email or Phone Number input */}
          {formData.useEmail ? (
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          ) : (
            <input
              type="text"
              name="phonenumber"
              placeholder="Phone Number"
              value={formData.phonenumber}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          )}

          {/* Toggle button */}
          <button
            type="button"
            onClick={handleToggle}
            className="w-full text-sm text-yellow-500 underline hover:text-yellow-600"
          >
            {formData.useEmail ? 'Use phone number instead' : 'Use email instead'}
          </button>

          {/* Password fields */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition"
          >
            Sign up
          </button>

          {/* Sign-in link */}
          <p className="text-center text-sm mt-4 text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-yellow-500 hover:underline">
              Sign in here
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
