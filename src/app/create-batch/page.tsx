'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CreateBatchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletPopupOpen, setWalletPopupOpen] = useState(false);
  const [walletTokens, setWalletTokens] = useState(200); // example tokens

  const [formData, setFormData] = useState({
    apiaries: '',
    jars: '',
    honeyKg: '',
    reportFile: null,
    latitude: '',
    longitude: ''
  });
  const [locationError, setLocationError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tokens, setTokens] = useState(0);
  const router = useRouter();

  const batchNumber = `BATCH-${Date.now().toString().slice(-6)}`;

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
        },
        () => setLocationError('Geolocation permission denied.')
      );
    } else {
      setLocationError('Geolocation not supported.');
    }
  }, []);

  const handleChange = (e: any) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitted(true);
    setTokens(Math.floor(Math.random() * 100) + 10); // mock token reward
  };

  const handleLogout = () => {
    alert("Logging out...");
  };

  return (
  <div className="relative min-h-screen text-black bg-gradient-to-br from-yellow-200 via-yellow-100 to-yellow-300">
    
    {/* Sidebar */}
    <div className={`fixed top-0 left-0 h-full w-64 bg-yellow-100 border-r-4 border-yellow-400 shadow-xl z-40 transform transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-6 py-4 bg-yellow-300 text-yellow-900 font-extrabold text-xl shadow-md rounded-tr-xl rounded-bl-xl text-center">
        🧭 Menu
      </div>
      <nav className="flex flex-col p-6 gap-4">
        <a href="/profile" className="hover:bg-yellow-200 px-4 py-2 rounded transition flex items-center gap-2">🧑 Profile</a>
        <a href="/settings" className="hover:bg-yellow-200 px-4 py-2 rounded transition flex items-center gap-2">⚙️ Settings</a>
        <a href="/about" className="hover:bg-yellow-200 px-4 py-2 rounded transition flex items-center gap-2">🐝 About Us</a>
        <a href="/contact" className="hover:bg-yellow-200 px-4 py-2 rounded transition flex items-center gap-2">📞 Contact Us</a>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition flex items-center gap-2"
        >🚪 Logout</button>
      </nav>
    </div>

    {/* Overlay Blur */}
    {sidebarOpen && (
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-30"
        onClick={() => setSidebarOpen(false)}
      />
    )}

    {/* Top Bar */}
    <header className="bg-yellow-300 text-black shadow-md px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSidebarOpen(true)}>
        <Image src="/beelogo.png" alt="Honey Certify Logo" width={40} height={40} className="filter grayscale contrast-200 brightness-0" />
        <h1 className="text-xl font-bold tracking-wide">HoneyCertify</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Wallet Button */}
        <div className="relative">
          <button
            onClick={() => setWalletPopupOpen(!walletPopupOpen)}
            className="bg-white text-yellow-500 border border-yellow-500 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 transition"
          >💰 Wallet</button>
          {walletPopupOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-yellow-200 shadow-lg p-4 rounded z-50">
              <p className="text-black font-semibold">You have <span className="text-yellow-600">{walletTokens} tokens</span>.</p>
              <button
                onClick={() => router.push('/buy-tokens')}
                className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full transition"
              >Buy Tokens</button>
            </div>
          )}
        </div>

        {/* Create Batch Button */}
        <button
          onClick={() => router.push('/create-batch')}
          className="bg-white text-yellow-500 border border-yellow-500 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 transition"
        >➕ Create Batch</button>
      </div>
    </header>

    {/* Form Content */}
    <main className="pt-20 px-4 pb-10 flex justify-center flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl space-y-6"
      >
        <h1 className="text-3xl font-bold text-yellow-600 text-center">Create your Batch 🐝</h1>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Batch Number</label>
          <input type="text" value={batchNumber} readOnly className="w-full px-4 py-2 border rounded-lg text-black bg-white" />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Number of Apiaries</label>
          <input type="number" name="apiaries" value={formData.apiaries} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg text-black bg-white" />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Number of Jars</label>
          <input type="number" name="jars" value={formData.jars} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg text-black bg-white" />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Total Honey (grams)</label>
          <input type="number" step="0.01" name="honeyKg" value={formData.honeyKg} onChange={handleChange} required className="w-full px-4 py-2 border rounded-lg text-black bg-white" />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Production Report File</label>
          <input type="file" name="reportFile" onChange={handleChange} required accept=".pdf,.doc,.docx,.jpg,.png" className="w-full px-4 py-2 border rounded-lg text-black bg-white" />
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Geolocation</label>
          {locationError ? (
            <p className="text-red-500">{locationError}</p>
          ) : (
            <p className="text-sm text-gray-600">Latitude: <span className="font-mono">{formData.latitude}</span>, Longitude: <span className="font-mono">{formData.longitude}</span></p>
          )}
        </div>

        {submitted && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 font-medium">
            <p>✅ Batch submitted successfully!</p>
            <p>🎉 Tokens Awarded: <strong>{tokens}</strong></p>
          </div>
        )}

        <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition">
          Submit Batch
        </button>
      </form>

      {/* Back to Dashboard Button (outside the form) */}
      <button
        onClick={() => router.push('/dashboard')}
        className="mt-6 w-full max-w-xs bg-yellow-400 text-white px-4 py-2 rounded hover:bg-yellow-500 transition shadow"
      >
        ⬅️ Back to Dashboard
      </button>
    </main>
  </div>
);


}
