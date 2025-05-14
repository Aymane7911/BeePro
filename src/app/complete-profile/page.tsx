'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';

export default function CompleteProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    passportId: '',
    phonenumber: '',
    passportFile: null as File | null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔁 Redirect if profile is already complete
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      const decoded: any = jwt.decode(token);
      if (decoded?.isProfileComplete) {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setForm(prev => ({ ...prev, passportFile: file || null }));
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.passportId || !form.phonenumber || !form.passportFile) {
      setError('All fields are required');
      return;
    }

    if (!validatePhoneNumber(form.phonenumber)) {
      setError('Invalid phone number format');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('passportId', form.passportId);
    formData.append('phonenumber', form.phonenumber);
    if (form.passportFile) formData.append('passportFile', form.passportFile);

    try {
      const res = await fetch('/api/complete-profile', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        const { token } = await res.json();
        Cookies.set('token', token); // Overwrite cookie
        router.replace('/dashboard');
        setForm({ passportId: '', phonenumber: '', passportFile: null }); // Reset the form
      } else {
        const result = await res.json();
        setError(result.message || 'Failed to complete profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    Cookies.remove('token');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 text-gray-800">
      <nav className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 shadow-lg sticky top-0 z-50 rounded-b-xl">
        <div className="flex items-center space-x-2">
          <Image src="/beelogo.png" alt="Honey Certify Logo" width={40} height={40} className="filter grayscale contrast-200 brightness-0" />
          <span className="text-xl font-bold text-black tracking-wide">HoneyCertify</span>
        </div>

        <div className="space-x-6 hidden md:flex">
          <button onClick={() => router.push('/profile')} className="text-black font-medium hover:scale-105 transition-transform duration-200">Profile</button>
          <button onClick={() => router.push('/settings')} className="text-black font-medium hover:scale-105 transition-transform duration-200">Settings</button>
          <button onClick={() => router.push('/about')} className="text-black font-medium hover:scale-105 transition-transform duration-200">About Us</button>
          <button onClick={() => router.push('/contact')} className="text-black font-medium hover:scale-105 transition-transform duration-200">Contact</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold text-yellow-600 text-center mb-4 animate-fade-in">
          Complete Your Profile 🐝
        </h1>
        <p className="text-center text-lg text-gray-700 mb-12 animate-fade-in delay-100">
          Add your passport information and phone number to complete your profile.
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Passport ID</label>
              <input
                type="text"
                name="passportId"
                placeholder="Passport ID"
                required
                value={form.passportId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phonenumber"
                placeholder="Phone Number"
                required
                value={form.phonenumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg text-black"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Passport File</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFile}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 mt-6"
        >
          Log Out
        </button>
      </div>
    </main>
  );
}
