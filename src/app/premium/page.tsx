'use client'

import { useState } from 'react';
import { Check, X, Crown, AlertCircle, Zap, Bot, FileText, BarChart, Shield, ArrowRight, ChevronLeft, Menu, Package, Database, Home, Settings, Users, Activity, HelpCircle, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Premium() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handlePurchase = () => {
    // In a real app, this would process payment
    setShowModal(false);
    // Show success notification
    setNotification({
      show: true,
      message: selectedPlan === 'premium' 
        ? 'You now have access to Premium features! Enjoy analyzing your honey production data with our AI tools.'
        : 'You are continuing with the Free plan.'
    });
    
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);
  };

  const [notification, setNotification] = useState({ show: false, message: '' });

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Basic tools for honey certification',
      features: [
        'Standard certification tracking',
        'Up to 5 batches per month',
        'Basic analytics',
        'Single user access',
        'Manual data entry'
      ],
      nonFeatures: [
        'AI-powered report analysis',
        'Unlimited batches',
        'Advanced analytics',
        'Multi-user access',
        'Priority support'
      ]
    },
    {
      name: 'Premium',
      price: '$49.99',
      period: 'per month',
      description: 'Advanced tools with AI-powered analytics',
      popular: true,
      features: [
        'All Free features',
        'AI-powered report analysis',
        'Unlimited batches',
        'Advanced analytics and forecasting',
        'Multi-user access (up to 5 users)',
        'Priority support',
        'Custom label integration',
        'Automated quality alerts'
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-yellow-200 to-white text-black">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 ease-in-out z-20 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Menu</h2>
          <button onClick={toggleSidebar} className="p-1 hover:bg-gray-700 rounded">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-8">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/');
                }}>
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/inventory');
                }}>
                <Package className="h-5 w-5 mr-3" />
                Inventory
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/create-batch');
                }}>
                <Database className="h-5 w-5 mr-3" />
                Batches
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 bg-yellow-500 text-white"
                onClick={(e) => {
                  e.preventDefault();
                  router.push('/premium');
                }}>
                <Crown className="h-5 w-5 mr-3" />
                Premium
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Activity className="h-5 w-5 mr-3" />
                Analytics
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Wallet className="h-5 w-5 mr-3" />
                Token Wallet
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Users className="h-5 w-5 mr-3" />
                Profile
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <HelpCircle className="h-5 w-5 mr-3" />
                Help
              </a>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        ></div>
      )}

      <header className="bg-white p-4 rounded-lg shadow text-black sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="mr-4 p-1 rounded hover:bg-gray-100 md:mr-6"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="mr-3 bg-yellow-500 p-2 rounded">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM6 14C5.45 14 5 13.55 5 13C5 12.45 5.45 12 6 12C6.55 12 7 12.45 7 13C7 13.55 6.55 14 6 14ZM9 9C8.45 9 8 8.55 8 8C8 7.45 8.45 7 9 7C9.55 7 10 7.45 10 8C10 8.55 9.55 9 9 9ZM15 9C14.45 9 14 8.55 14 8C14 7.45 14.45 7 15 7C15.55 7 16 7.45 16 8C16 8.55 15.55 9 15 9ZM18 14C17.45 14 17 13.55 17 13C17 12.45 17.45 12 18 12C18.55 12 19 12.45 19 13C19 13.55 18.55 14 18 14Z" fill="white"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">HoneyCertify</h1>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-yellow-100 rounded-full mb-4">
            <Crown className="h-6 w-6 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Upgrade to Premium</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock advanced AI-powered tools to analyze your production and enhance your honey certification process
          </p>
        </div>

        {/* Premium Feature Showcase */}
        <div className="bg-yellow-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Why Go Premium?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Report Analysis</h3>
              <p className="text-gray-600">
                Our advanced AI can analyze your lab reports and production data to automatically extract key metrics and certification requirements.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Documentation</h3>
              <p className="text-gray-600">
                Generate certification documentation automatically based on your production data and quality standards.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">
                Gain deeper insights into your honey production quality trends and certification rates over time.
              </p>
            </div>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`bg-white rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 ${plan.popular ? 'border-2 border-yellow-500 relative' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white px-4 py-1 uppercase text-xs font-bold tracking-wider">
                  Recommended
                </div>
              )}
              <div className={`p-8 ${plan.popular ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : ''}`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="ml-1 text-sm opacity-80">{plan.period}</span>}
                </div>
                <p className={`text-sm ${plan.popular ? 'text-white opacity-90' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.nonFeatures && plan.nonFeatures.map((feature, index) => (
                    <li key={`non-${index}`} className="flex items-start text-gray-400">
                      <X className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanSelect(plan.name.toLowerCase())}
                  className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center
                    ${plan.popular 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  {plan.popular ? (
                    <>
                      Select Premium <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Continue with Free'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AI Feature Spotlight */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">AI-Powered Report Analysis</h2>
              <p className="mb-6">
                Our premium feature uses advanced AI to extract critical information from your production reports and lab test results automatically.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Zap className="h-5 w-5 text-yellow-300 mr-2 mt-0.5" />
                  <span>Automatic extraction of quality metrics</span>
                </li>
                <li className="flex items-start">
                  <Zap className="h-5 w-5 text-yellow-300 mr-2 mt-0.5" />
                  <span>Identify certification eligibility instantly</span>
                </li>
                <li className="flex items-start">
                  <Zap className="h-5 w-5 text-yellow-300 mr-2 mt-0.5" />
                  <span>Highlight critical quality issues</span>
                </li>
                <li className="flex items-start">
                  <Zap className="h-5 w-5 text-yellow-300 mr-2 mt-0.5" />
                  <span>Process multiple reports simultaneously</span>
                </li>
              </ul>
              <button 
                onClick={() => handlePlanSelect('premium')}
                className="bg-white text-blue-600 hover:bg-gray-100 py-3 px-6 rounded-lg font-bold transition flex items-center"
              >
                Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-black">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Lab Report Analysis</h3>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  AI Processed
                </span>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Moisture Content</span>
                    <span className="font-medium">17.3%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">✓ Within certification range (16-18%)</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">HMF Level</span>
                    <span className="font-medium">12.5 mg/kg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">✓ Below maximum limit (40 mg/kg)</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Pollen Analysis</span>
                    <span className="font-medium">98.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <p className="text-xs text-green-600 mt-1">✓ Origin verified (Acacia)</p>
                </div>
                
                <div className="flex justify-between text-sm font-medium">
                  <span>Certification Eligibility:</span>
                  <span className="text-green-600">Fully Certified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl p-8 shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold mb-2">What kind of reports can the AI analyze?</h3>
              <p className="text-gray-600">
                Our AI can analyze standard laboratory reports for honey quality including moisture content, HMF levels, diastase activity, pollen analysis, and more. It also processes production data to help with batch certification.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How accurate is the AI analysis?</h3>
              <p className="text-gray-600">
                Our AI has been trained on thousands of honey quality reports and achieves accuracy rates of over 95% for standard metrics. All critical decisions still receive human verification as part of our quality assurance process.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I cancel my Premium subscription?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your Premium subscription at any time. Your benefits will continue until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Do I need special training to use the Premium features?</h3>
              <p className="text-gray-600">
                No special training is required. Our Premium features are designed to be intuitive and easy to use. We also provide comprehensive documentation and support to help you make the most of your subscription.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Purchase Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Confirm Your Selection</h3>
            <p className="mb-4 text-gray-600">
              {selectedPlan === 'premium' 
                ? 'You are about to upgrade to our Premium plan for $49.99 per month.'
                : 'You are choosing to continue with our Free plan.'}
            </p>
            
            {selectedPlan === 'premium' && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200 flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Your subscription will begin immediately and you'll be charged $49.99. You can cancel anytime.
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                className={`px-4 py-2 rounded-md text-white ${
                  selectedPlan === 'premium' 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {selectedPlan === 'premium' ? 'Confirm Purchase' : 'Confirm Selection'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg max-w-md z-50">
          {notification.message}
        </div>
      )}
      
      <footer className="bg-gray-100 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 HoneyCertify. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2 text-sm">
            <a href="#" className="hover:text-yellow-600">Terms of Service</a>
            <a href="#" className="hover:text-yellow-600">Privacy Policy</a>
            <a href="#" className="hover:text-yellow-600">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}