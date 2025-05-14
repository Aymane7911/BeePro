'use client'

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Layers, Database, Tag, Package, RefreshCw, Menu, X, Home, Settings, Users, Activity, HelpCircle, Wallet } from 'lucide-react';

// Mock data - in a real implementation, this would come from your backend microservices
const initialData = {
  jars: [
    { name: 'Glass Jars', count: 245, color: '#4299e1' },
    { name: 'Plastic Jars', count: 157, color: '#38b2ac' },
    { name: 'Metal Jars', count: 89, color: '#805ad5' }
  ],
  labels: [
    { name: 'Standard', count: 189, color: '#f56565' },
    { name: 'Premium', count: 145, color: '#ed8936' },
    { name: 'Custom', count: 157, color: '#ecc94b' }
  ],
  batches: [
    { id: 'B1001', jarType: 'Glass', labelType: 'Premium', quantity: 50, date: '2025-05-10' },
    { id: 'B1002', jarType: 'Plastic', labelType: 'Standard', quantity: 75, date: '2025-05-11' },
    { id: 'B1003', jarType: 'Metal', labelType: 'Custom', quantity: 30, date: '2025-05-12' },
    { id: 'B1004', jarType: 'Glass', labelType: 'Standard', quantity: 65, date: '2025-05-13' }
  ],
  tokenStats: {
    totalTokens: 1000,
    originOnly: 100,
    qualityOnly: 100,
    bothCertifications: 100,
    remainingTokens: 700,
    totalJars: 2000
  }
};

// Token certification distribution data
const tokenDistributionData = [
  { name: 'Origin Only', value: 100, color: '#3182CE' },
  { name: 'Quality Only', value: 100, color: '#38A169' },
  { name: 'Both Certifications', value: 100, color: '#805AD5' },
  { name: 'Remaining Tokens', value: 700, color: '#CBD5E0' }
];

// Jar certification status data
const jarStatusData = [
  { name: 'Origin Only', value: 100, color: '#3182CE' },
  { name: 'Quality Only', value: 100, color: '#38A169' },
  { name: 'Both Certifications', value: 100, color: '#805AD5' },
  { name: 'No Certification', value: 1700, color: '#CBD5E0' }
];

// A microservice dashboard for jar inventory management
export default function JarManagementDashboard() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token] = useState("HCT-73829-ABC45"); // Placeholder token

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const refreshData = () => {
    setLoading(true);
    
    // Simulate a microservice API call with setTimeout
    setTimeout(() => {
      // In a real app, you would fetch data from your microservices here
      // Using fake data for demonstration purposes
      const updatedData = {
        ...data,
        jars: data.jars.map(jar => ({ 
          ...jar, 
          count: jar.count + Math.floor(Math.random() * 10) - 3
        })),
        batches: [
          { id: 'B1005', jarType: 'Plastic', labelType: 'Custom', quantity: 45, date: '2025-05-13' },
          ...data.batches.slice(0, 3)
        ]
      };
      
      setData(updatedData);
      setLoading(false);
      setLastUpdated(new Date().toLocaleString());
    }, 1000);
  };

  // Calculate totals
  const totalJars = data.jars.reduce((sum, jar) => sum + jar.count, 0);
  const totalLabels = data.labels.reduce((sum, label) => sum + label.count, 0);
  const totalBatches = data.batches.length;

  return (
    <div className="flex flex-col space-y-6 p-6 min-h-screen bg-gradient-to-b from-yellow-200 to-white text-black">
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
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Package className="h-5 w-5 mr-3" />
                Inventory
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Tag className="h-5 w-5 mr-3" />
                Labels
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <Layers className="h-5 w-5 mr-3" />
                Batches
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
                Users
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

      <header className="bg-white p-4 rounded-lg shadow text-black">
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
            <div className="mr-4 bg-gray-100 p-3 rounded-lg flex items-center">
              <Wallet className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Token Balance</p>
                <p className="text-lg font-bold">{data.tokenStats.remainingTokens} / {data.tokenStats.totalTokens}</p>
              </div>
            </div>
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? (
                <span className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </span>
              ) : (
                <span className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </span>
              )}
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Last updated: {lastUpdated}
        </p>
      </header>

      {/* Token Wallet Section */}
      <div className="bg-white p-4 rounded-lg shadow text-black">
        <h2 className="text-lg font-semibold mb-4">Token Wallet Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold mb-3">Token Distribution</h3>
            <div className="flex flex-wrap justify-between mb-4">
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                  <p className="text-sm font-medium">Origin Only</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.originOnly} tokens</p>
                <p className="text-xs text-gray-500">Applied to {data.tokenStats.originOnly} jars</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-sm font-medium">Quality Only</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.qualityOnly} tokens</p>
                <p className="text-xs text-gray-500">Applied to {data.tokenStats.qualityOnly} jars</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                  <p className="text-sm font-medium">Both Certifications</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.bothCertifications * 2} tokens</p>
                <p className="text-xs text-gray-500">Applied to {data.tokenStats.bothCertifications} jars</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-gray-400 mr-2"></div>
                  <p className="text-sm font-medium">Remaining Tokens</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.remainingTokens} tokens</p>
                <p className="text-xs text-gray-500">Available for use</p>
              </div>
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={tokenDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {tokenDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} tokens`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Jar Certification Status */}
      <div className="bg-white p-4 rounded-lg shadow text-black">
        <h2 className="text-lg font-semibold mb-4">Jar Certification Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-center mb-2">
              <h3 className="text-md font-semibold">Total Jars: {data.tokenStats.totalJars}</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={jarStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {jarStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} jars`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-md font-semibold mb-3">Certification Progress</h3>
            <div className="flex flex-wrap justify-between mb-4">
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                  <p className="text-sm font-medium">Origin Certified</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.originOnly} jars</p>
                <p className="text-xs text-gray-500">{((data.tokenStats.originOnly / data.tokenStats.totalJars) * 100).toFixed(1)}% of inventory</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-sm font-medium">Quality Certified</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.qualityOnly} jars</p>
                <p className="text-xs text-gray-500">{((data.tokenStats.qualityOnly / data.tokenStats.totalJars) * 100).toFixed(1)}% of inventory</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                  <p className="text-sm font-medium">Fully Certified</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.bothCertifications} jars</p>
                <p className="text-xs text-gray-500">{((data.tokenStats.bothCertifications / data.tokenStats.totalJars) * 100).toFixed(1)}% of inventory</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-gray-400 mr-2"></div>
                  <p className="text-sm font-medium">Uncertified</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.totalJars - data.tokenStats.originOnly - data.tokenStats.qualityOnly - data.tokenStats.bothCertifications} jars</p>
                <p className="text-xs text-gray-500">{(((data.tokenStats.totalJars - data.tokenStats.originOnly - data.tokenStats.qualityOnly - data.tokenStats.bothCertifications) / data.tokenStats.totalJars) * 100).toFixed(1)}% of inventory</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}