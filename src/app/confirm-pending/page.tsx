'use client';

import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

export default function ConfirmPendingPage() {
  const router = useRouter();

  return (
    <section className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="text-center p-6 max-w-md mx-auto">
        {/* Confirmation Icon */}
        <CheckCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />

        <h1 className="text-3xl font-bold text-yellow-500 mb-2">
          Registration Submitted
        </h1>

        <p className="text-lg text-gray-700 mb-6">
          Waiting for confirmation. Please check your email or phone for further instructions.
        </p>

        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Loader2 className="animate-spin w-6 h-6 text-yellow-400" />
        </div>

        {/* Go to Home Button */}
        <button
          onClick={() => router.push('/')}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded transition"
        >
          Go to Home
        </button>
      </div>
    </section>
  );
}
