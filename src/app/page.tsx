'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useAnimation, useInView } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export default function Hero() {
  const [showDetails, setShowDetails] = useState(false);
  const router = useRouter();

  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [inView, controls]);

  return (
    <main className="flex flex-col items-center justify-center text-white bg-black">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center text-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src="/bee_keeper.mp4" type="video/mp4" />
        </video>

        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        />

        <div className="absolute top-0 left-0 z-20 p-5">
          <Image src="/beelogo.png" alt="Honey Certify Logo" width={130} height={130} />
        </div>

        <div className="absolute top-6 right-6 z-20 flex gap-4">
          <button
            onClick={() => router.push('/login')}
            className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white font-semibold py-2 px-4 rounded transition duration-200"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/register')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded transition duration-200"
          >
            Register
          </button>
        </div>

        <motion.div
          className="relative z-10 px-4 max-w-6xl w-full flex flex-col md:flex-row justify-center items-center gap-10"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
        >
          <div className="max-w-2xl text-center">
            <AnimatePresence mode="wait">
              {!showDetails ? (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-5xl font-bold mb-4 font-bungee">
                    Certify Your Honey. Gain Trust. Get Verified.
                  </h1>
                  <p className="text-xl mb-8">
                    Blockchain-backed certification for honey producers. Earn customer trust with verified reports.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                      onClick={() => router.push('/register')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded"
                    >
                      Get Started
                    </button>
                    <button
                      onClick={() => setShowDetails(true)}
                      className="bg-white text-black hover:bg-yellow-500 hover:text-white font-semibold py-2 px-6 rounded"
                    >
                      Learn More
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-4xl font-semibold mb-4">How It Works</h2>
                  <div className="text-lg space-y-4 mb-6 text-left">
                    <p>🐝 <strong>Register:</strong> Sign up and submit your honey production data.</p>
                    <p>💰 <strong>Buy Tokens:</strong> Purchase tokens to start the verification.</p>
                    <p>🔒 <strong>Verify & Certify:</strong> Upload reports and get certified.</p>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowDetails(false)}
                      className="bg-white text-black hover:bg-yellow-500 hover:text-white font-semibold py-2 px-6 rounded"
                    >
                      Go Back
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-6 items-center p-5">
            <Image src="/originbee.png" alt="origin logo" width={200} height={200} />
            <Image src="/premiumbee.png" alt="premium logo" width={200} height={200} />
          </div>
        </motion.div>
      </section>

      {/* Testimonies Section with enhanced background */}
<motion.section
  ref={ref}
  initial="hidden"
  animate={controls}
  variants={{
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } },
  }}
  className="relative w-full px-6 py-20 text-center overflow-hidden"
>
  {/* Soft animated blobs in background */}
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div className="absolute w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse top-[-100px] left-[-100px]" />
    <div className="absolute w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse bottom-[-100px] right-[-100px]" />
  </div>

  <h2 className="text-4xl font-bold mb-12 text-yellow-700 relative z-10">What Our Users Say</h2>
  <div className="max-w-6xl mx-auto grid gap-10 grid-cols-1 md:grid-cols-3 relative z-10">
    {[1, 2, 3].map((id) => (
      <div key={id} className="flex flex-col items-center bg-white bg-opacity-80 p-6 rounded-xl shadow-lg backdrop-blur-md">
        <div className="w-24 h-24 rounded-full bg-gray-300 mb-4 overflow-hidden border-4 border-yellow-400 shadow-md">
          
        </div>
        <p className="text-lg italic text-gray-800 max-w-xs">
          {id === 1 &&
            '“The certification process was seamless. Our customers love the transparency!”'}
          {id === 2 &&
            '“The token-based verification is genius. Great experience!”'}
          {id === 3 &&
            '“Trust has increased dramatically since we got certified!”'}
        </p>
      </div>
    ))}
  </div>
</motion.section>

    </main>
  );
}
