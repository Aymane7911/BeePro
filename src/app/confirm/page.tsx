'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const params = useSearchParams();
  const router = useRouter();
  const hasFetched = useRef(false);  // Prevent double-fetch

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (hasFetched.current) return;  // Prevent second call
    hasFetched.current = true;

    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing token.');
      return;
    }

    fetch(`/api/confirm-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email has been confirmed successfully!');
          // Wait for a few seconds to allow user to read the message
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Invalid or expired token.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Unexpected server error.');
      });
  }, [params, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {status === 'loading' && <p>Confirming your email...</p>}
      {status === 'success' && (
        <div>
          <p className="text-green-600">{message}</p>
          <p className="text-gray-500">Redirecting you to login...</p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <p className="text-red-600">{message}</p>
          <p className="text-gray-500">Please check the link or contact support.</p>
        </div>
      )}
    </div>
  );
}
