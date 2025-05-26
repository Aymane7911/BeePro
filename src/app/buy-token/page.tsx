'use client'

import React, { useState } from 'react';
import { CreditCard, ArrowLeft, Check, AlertCircle, Loader } from 'lucide-react';

const BuyTokensPage = () => {
  // Get initial token amount from URL params if redirected from modal
  const urlParams = new URLSearchParams(window.location.search);
  const initialTokens = parseInt(urlParams.get('tokens') ?? '100');

  
  const [tokensToAdd, setTokensToAdd] = useState(initialTokens);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
 // 'success', 'error', null
  const [selectedPackage, setSelectedPackage] = useState<{ tokens: number } | null>(null);


  // Token packages for easier selection
  const tokenPackages = [
    { tokens: 50, price: 5.00, popular: false },
    { tokens: 100, price: 10.00, popular: true },
    { tokens: 250, price: 22.50, popular: false },
    { tokens: 500, price: 40.00, popular: false },
    { tokens: 1000, price: 75.00, popular: false }
  ];

  const calculatePrice = (tokens: number): string => {
  return (tokens * 0.10).toFixed(2);
};


  const handlePackageSelect = (pkg: { tokens: number }) => {
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
      // In real implementation, you'd integrate with Stripe here
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
  
  console.log(`Successfully purchased ${tokensToAdd} tokens for $${calculatePrice(tokensToAdd)}`);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            You've successfully purchased {tokensToAdd} tokens for ${calculatePrice(tokensToAdd)}
          </p>
          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
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
  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
>
  Return to Dashboard
</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Buy Tokens</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Token Packages */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Choose a Package</h2>
            <div className="space-y-3">
              {tokenPackages.map((pkg, index) => (
                <div
                  key={index}
                  onClick={() => handlePackageSelect(pkg)}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPackage?.tokens === pkg.tokens
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 left-4 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Most Popular
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{pkg.tokens} Tokens</p>
                      <p className="text-sm text-gray-500">${(pkg.price / pkg.tokens).toFixed(3)} per token</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${pkg.price}</p>
                      {pkg.tokens >= 250 && (
                        <p className="text-xs text-green-600 font-medium">Save {Math.round((1 - (pkg.price / pkg.tokens) / 0.10) * 100)}%</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-900 mb-3">Or choose custom amount</h3>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={tokensToAdd}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setTokensToAdd(value);
                    setSelectedPackage(null);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  min="1"
                  max="10000"
                  placeholder="Enter tokens"
                />
                <span className="text-gray-500 font-medium">tokens</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Details</h2>
            
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Tokens</span>
                <span className="font-medium">{tokensToAdd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per token</span>
                <span className="font-medium">$0.10</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">${calculatePrice(tokensToAdd)}</span>
                </div>
              </div>
            </div>

            {/* Test Mode Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Test Mode</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This is running in test mode. No real charges will be made. 
                    Use test card: 4242 4242 4242 4242
                  </p>
                </div>
              </div>
            </div>

            {/* Stripe Payment Form Simulation */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  defaultValue="4242 4242 4242 4242"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    defaultValue="12/28"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    defaultValue="123"
                  />
                </div>
              </div>
            </div>

            {paymentStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-700 font-medium">Payment failed. Please try again.</span>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handleStripePayment}
              disabled={isProcessing || tokensToAdd <= 0}
              className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ${calculatePrice(tokensToAdd)}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Secure payment powered by Stripe. Your payment information is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyTokensPage;