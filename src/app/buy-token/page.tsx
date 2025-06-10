'use client'

import React, { useState } from 'react';
import { CreditCard, ArrowLeft, Check, AlertCircle, Loader, Sparkles, Star, Zap } from 'lucide-react';

const BuyTokensPage = () => {
  // Get initial token amount from URL params if redirected from modal
  const urlParams = new URLSearchParams(window.location.search);
  const initialTokens = parseInt(urlParams.get('tokens') ?? '100');

  
  const [tokensToAdd, setTokensToAdd] = useState(initialTokens);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Token packages with enhanced styling data
  const tokenPackages = [
    { 
      tokens: 50, 
      price: 5.00, 
      popular: false,
      gradient: 'from-blue-500 to-blue-600',
      icon: '💎',
      badge: 'Starter'
    },
    { 
      tokens: 100, 
      price: 10.00, 
      popular: true,
      gradient: 'from-yellow-500 to-orange-500',
      icon: '⭐',
      badge: 'Most Popular'
    },
    { 
      tokens: 250, 
      price: 22.50, 
      popular: false,
      gradient: 'from-purple-500 to-pink-500',
      icon: '🚀',
      badge: 'Great Value'
    },
    { 
      tokens: 500, 
      price: 40.00, 
      popular: false,
      gradient: 'from-green-500 to-emerald-600',
      icon: '⚡',
      badge: 'Power User'
    },
    { 
      tokens: 1000, 
      price: 75.00, 
      popular: false,
      gradient: 'from-indigo-600 to-purple-700',
      icon: '👑',
      badge: 'Ultimate'
    }
  ];

  const calculatePrice = (tokens: number): string => {
    return (tokens * 0.10).toFixed(2);
  };

  const handlePackageSelect = (pkg: { tokens: number; price: number; popular: boolean; gradient: string; icon: string; badge: string }) => {
    setSelectedPackage(pkg);
    setTokensToAdd(pkg.tokens);
  };

  // Simulate Stripe payment process
  const handleStripePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      // Simulate API call to create Stripe payment intent
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment processing with Stripe test cards
      const testCardSuccess = Math.random() > 0.2; // 80% success rate for demo
      
      if (testCardSuccess) {
        setPaymentStatus('success');
        const currentBalance = parseInt(localStorage.getItem('tokenBalance') || '0');
        const newBalance = currentBalance + tokensToAdd;
        localStorage.setItem('tokenBalance', newBalance.toString());
        
        // Dispatch custom event to update token balance
        window.dispatchEvent(new CustomEvent('tokensUpdated', {
          detail: { 
            action: 'add',
            tokensAdded: tokensToAdd,
            newBalance: newBalance
          }
        }));
        
        console.log(`Successfully purchased ${tokensToAdd} tokens for ${calculatePrice(tokensToAdd)}`);
      } else {
        setPaymentStatus('error');
      }
    } catch (error) {
      setPaymentStatus('error');
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentStatus(null);
    setTokensToAdd(100);
    setSelectedPackage(null);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8 max-w-md w-full text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-[bounce_1s_ease-in-out]">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-2">
            You've successfully purchased 
          </p>
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 mb-6">
            <span className="text-2xl font-bold text-orange-600">{tokensToAdd.toLocaleString()}</span>
            <span className="text-gray-600 ml-2">tokens for</span>
            <span className="text-2xl font-bold text-green-600 ml-2">${calculatePrice(tokensToAdd)}</span>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Buy More Tokens
            </button>
            <button
              onClick={() => {
                // Pass the purchased tokens back via URL
                const currentUrl = new URL(window.location.href);
                currentUrl.pathname = '/dashboard'; // or wherever your main component is
                currentUrl.searchParams.set('tokensAdded', tokensToAdd.toString());

                window.location.href = currentUrl.toString();
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 px-3 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Buy Tokens
              </h1>
              <p className="text-gray-500 text-sm mt-1">Power up your account with more tokens</p>
            </div>
            
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Token Packages - Now takes 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Package</h2>
                <p className="text-gray-600">Select the perfect token package for your needs</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {tokenPackages.map((pkg, index) => (
                  <div
                    key={index}
                    onClick={() => handlePackageSelect(pkg)}
                    className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedPackage?.tokens === pkg.tokens
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-lg'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-4 py-1 rounded-full font-bold shadow-lg flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          {pkg.badge}
                        </div>
                      </div>
                    )}
                    
                    {!pkg.popular && (
                      <div className="absolute -top-2 right-4 bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {pkg.badge}
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className="text-3xl mb-2">{pkg.icon}</div>
                      <h3 className="text-xl font-bold text-gray-900">{pkg.tokens.toLocaleString()} Tokens</h3>
                      <p className="text-sm text-gray-500">${(pkg.price / pkg.tokens).toFixed(3)} per token</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-2">${pkg.price}</div>
                      {pkg.tokens >= 250 && (
                        <div className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          <Zap className="w-3 h-3 mr-1" />
                          Save {Math.round((1 - (pkg.price / pkg.tokens) / 0.10) * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                  Custom Amount
                </h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={tokensToAdd}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setTokensToAdd(value);
                      setSelectedPackage(null);
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="1"
                    max="10000"
                    placeholder="Enter tokens"
                  />
                  <div className="text-gray-600 font-medium bg-white px-4 py-3 rounded-xl border-2 border-gray-200">
                    tokens
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details - Now takes 1/3 width */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-blue-600" />
                Payment Details
              </h2>
              
              {/* Order Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Tokens</span>
                  <span className="font-bold text-lg">{tokensToAdd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Price per token</span>
                  <span className="font-medium">$0.10</span>
                </div>
                <div className="border-t border-blue-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${calculatePrice(tokensToAdd)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Test Mode Notice */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Test Mode</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      No real charges. Use: 4242 4242 4242 4242
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    defaultValue="4242 4242 4242 4242"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      defaultValue="12/28"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      defaultValue="123"
                    />
                  </div>
                </div>
              </div>

              {paymentStatus === 'error' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-700 font-semibold">Payment failed. Please try again.</span>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handleStripePayment}
                disabled={isProcessing || tokensToAdd <= 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center text-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-6 h-6 mr-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6 mr-3" />
                    Pay ${calculatePrice(tokensToAdd)}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
                🔒 Secure payment powered by Stripe. Your information is encrypted and protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyTokensPage;