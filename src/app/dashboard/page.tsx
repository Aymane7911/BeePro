'use client'

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Layers, Database, Tag, Package, RefreshCw, Menu, X, Home, Settings, Users, Activity, HelpCircle, Wallet, PlusCircle } from 'lucide-react';
import { SearchIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/navigation';


// Mock data - in a real implementation, this would come from your backend microservices
const initialData = {
  containers: [
    { name: 'Glass Containers', weight: 245, color: '#4299e1' },
    { name: 'Plastic Containers', weight: 157, color: '#38b2ac' },
    { name: 'Metal Containers', weight: 89, color: '#805ad5' }
  ],
  labels: [
    { name: 'Standard', count: 189, color: '#f56565' },
    { name: 'Premium', count: 145, color: '#ed8936' },
    { name: 'Custom', count: 157, color: '#ecc94b' }
  ],
  batches: [
    { id: 'B1001', containerType: 'Glass', labelType: 'Premium', weightKg: 50, date: '2025-05-10' },
    { id: 'B1002', containerType: 'Plastic', labelType: 'Standard', weightKg: 75, date: '2025-05-11' },
    { id: 'B1003', containerType: 'Metal', labelType: 'Custom', weightKg: 30, date: '2025-05-12' },
    { id: 'B1004', containerType: 'Glass', labelType: 'Standard', weightKg: 65, date: '2025-05-13' }
  ],
  tokenStats: {
    totalTokens: 1000,
    originOnly: 100,
    qualityOnly: 100,
    bothCertifications: 100,
    remainingTokens: 700,
    totalKg: 2000
  },
  certifiedHoneyWeight: {
    originOnly: 250, // weight in kg
    qualityOnly: 450, // weight in kg
    bothCertifications: 150, // weight in kg
    uncertified: 1150 // weight in kg
  }
};

// Token certification distribution data
const tokenDistributionData = [
  { name: 'Origin Only', value: 100, color: '#3182CE' },
  { name: 'Quality Only', value: 100, color: '#38A169' },
  { name: 'Both Certifications', value: 100, color: '#805AD5' },
  { name: 'Remaining Tokens', value: 700, color: '#CBD5E0' }
];

// Honey certification status data
const honeyStatusData = [
  { name: 'Origin Only', value: 250, color: '#3182CE' },
  { name: 'Quality Only', value: 450, color: '#38A169' },
  { name: 'Both Certifications', value: 150, color: '#805AD5' },
  { name: 'No Certification', value: 1150, color: '#CBD5E0' }
];

// A microservice dashboard for jar inventory management
export default function JarManagementDashboard() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token] = useState("HCT-73829-ABC45"); // Placeholder token
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBuyTokensModal, setShowBuyTokensModal] = useState(false);
  const [tokensToAdd, setTokensToAdd] = useState(100);
  const [batchFormData, setBatchFormData] = useState({
    containerType: 'Glass',
    labelType: 'Standard',
    weightKg: 10,
    weights: {
      originOnly: data.certifiedHoneyWeight.originOnly,
      qualityOnly: data.certifiedHoneyWeight.qualityOnly,
      bothCertifications: data.certifiedHoneyWeight.bothCertifications
    }
  });
  const [batchNumber, setBatchNumber] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '' });

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

  const handleBatchFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('weight_')) {
      const certType = name.replace('weight_', '');
      setBatchFormData({
        ...batchFormData,
        weights: {
          ...batchFormData.weights,
          [certType]: parseInt(value, 10) || 0
        }
      });
    } else {
      setBatchFormData({
        ...batchFormData,
        [name]: value
      });
    }
  };

  const handleBuyTokens = () => {
    // In a real app, this would connect to a payment processor
    // For demo purposes, we'll just update the token count
    const updatedTokenStats = {
      ...data.tokenStats,
      totalTokens: data.tokenStats.totalTokens + tokensToAdd,
      remainingTokens: data.tokenStats.remainingTokens + tokensToAdd
    };
    
    setData({
      ...data,
      tokenStats: updatedTokenStats
    });
    
    setShowBuyTokensModal(false);
  };

  const createBatch = () => {
  // Generate strong batch number with timestamp
  const timestamp = new Date().getTime();
  const strongBatchNumber = `${batchNumber}-${timestamp}`;
  
  // In a real app, you would send this data to your backend
  const newBatch = {
    id: strongBatchNumber,
    containerType: batchFormData.containerType,
    labelType: batchFormData.labelType,
    weightKg: parseInt(batchFormData.weightKg, 10),
    date: new Date().toISOString().split('T')[0]
  };

  setData({
    ...data,
    batches: [newBatch, ...data.batches],
    certifiedHoneyWeight: {
      ...batchFormData.weights
    }
  });

  // Show notification with new batch number
  setNotification({
    show: true,
    message: `Batch created successfully! Your batch number is: ${strongBatchNumber}`
  });
  
  // Hide notification after 5 seconds
  setTimeout(() => {
    setNotification({ show: false, message: '' });
  }, 5000);

  // Reset and close modal
  setBatchNumber('');
  setShowBatchModal(false);
};
    const [searchTerm, setSearchTerm] = useState("");
    const [showAllBatches, setShowAllBatches] = useState(false);
    const [expandedBatches, setExpandedBatches] = useState([]);
    // Sample batch data
    const allBatches = [
      {
        id: "B-2025-001",
        name: "January Organic Coffee",
        status: "Certified",
        expiryDate: "2025-12-31",
        certificationDate: "2025-01-15",
        completedChecks: 8,
        totalChecks: 8,
        totalKg: 1250,
        jarsUsed: 500,
        originOnly: 250,
        originOnlyPercent: 20,
        qualityOnly: 125,
        qualityOnlyPercent: 10,
        bothCertifications: 750,
        bothCertificationsPercent: 60,
        uncertified: 125,
        uncertifiedPercent: 10
      },
      {
        id: "B-2025-002",
        name: "February Robusta Blend",
        status: "Pending",
        expiryDate: "-",
        certificationDate: "-",
        completedChecks: 5,
        totalChecks: 8,
        totalKg: 980,
        jarsUsed: 392,
        originOnly: 300,
        originOnlyPercent: 30.6,
        qualityOnly: 150,
        qualityOnlyPercent: 15.3,
        bothCertifications: 180,
        bothCertificationsPercent: 18.4,
        uncertified: 350,
        uncertifiedPercent: 35.7
      },
      {
        id: "B-2025-003",
        name: "March Arabica Premium",
        status: "In Progress",
        expiryDate: "-",
        certificationDate: "-",
        completedChecks: 3,
        totalChecks: 8,
        totalKg: 1500,
        jarsUsed: 600,
        originOnly: 450,
        originOnlyPercent: 30,
        qualityOnly: 225,
        qualityOnlyPercent: 15,
        bothCertifications: 225,
        bothCertificationsPercent: 15,
        uncertified: 600,
        uncertifiedPercent: 40
      },
      {
        id: "B-2025-004",
        name: "Q1 Specialty Blend",
        status: "Certified",
        expiryDate: "2025-12-15",
        certificationDate: "2025-03-20",
        completedChecks: 8,
        totalChecks: 8,
        totalKg: 850,
        jarsUsed: 340,
        originOnly: 170,
        originOnlyPercent: 20,
        qualityOnly: 85,
        qualityOnlyPercent: 10,
        bothCertifications: 510,
        bothCertificationsPercent: 60,
        uncertified: 85,
        uncertifiedPercent: 10
      },
      {
        id: "B-2025-005",
        name: "April Dark Roast",
        status: "Rejected",
        expiryDate: "-",
        certificationDate: "-",
        completedChecks: 6,
        totalChecks: 8,
        totalKg: 1000,
        jarsUsed: 400,
        originOnly: 100,
        originOnlyPercent: 10,
        qualityOnly: 50,
        qualityOnlyPercent: 5,
        bothCertifications: 150,
        bothCertificationsPercent: 15,
        uncertified: 700,
        uncertifiedPercent: 70
      }
    ];

    // Filter batches based on search term
    const filteredBatches = allBatches.filter(batch => 
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Determine which batches to display
    const displayedBatches = showAllBatches ? filteredBatches : filteredBatches.slice(0, 3);

    // Function to toggle batch expansion
    const toggleBatchExpansion = (batchId) => {
      if (expandedBatches.includes(batchId)) {
        setExpandedBatches(expandedBatches.filter(id => id !== batchId));
      } else {
        setExpandedBatches([...expandedBatches, batchId]);
      }
    };

  // Calculate totals
  const totalWeight = data.containers.reduce((sum, container) => sum + container.weight, 0);
  const totalLabels = data.labels.reduce((sum, label) => sum + label.count, 0);
  const totalBatches = data.batches.length;

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [timeRange, setTimeRange] = useState('Monthly');
  const router = useRouter();


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
  <a 
    href="/inventory" 
    onClick={(e) => {
      e.preventDefault();
      
      // For a React app with routing, you could use:
       router.push('/inventory');
    }} 
    className="flex items-center px-4 py-3 hover:bg-gray-700"
  >
    <Package className="h-5 w-5 mr-3" />
    Inventory
  </a>
</li>
            <li>
              <a href="/create-batch" 
              onClick={(e) => {
          e.preventDefault();
          // For a React app with routing, you could use:
          router.push('/create-batch');
        }} 
              className="flex items-center px-4 py-3 hover:bg-gray-700">
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
              <button 
                onClick={() => setShowBuyTokensModal(true)}
                className="ml-3 p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Buy
              </button>
            </div>
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-3"
            >
              <Package className="w-4 h-4 mr-2" />
              Create Batch
            </button>
            <button
              onClick={() => router.push('/premium')}
              className="flex items-center px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-700 mr-3"
            >
              <Package className="w-4 h-4 mr-2" />
              Premium
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Last updated: {lastUpdated}
        </p>
      </header>

      {/* Create Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Batch</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <input
                type="text"
                name="batchNumber"
                value={batchNumber || ''}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter batch number"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchNumber('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={createBatch}
                disabled={!batchNumber}
                className={`px-4 py-2 rounded-md text-white ${
                  batchNumber ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Create
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
                  <p className="text-sm font-medium">Origin certified</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.originOnly} tokens</p>
                <p className="text-xs text-gray-500">Applied to {data.tokenStats.originOnly} kg of honey</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-sm font-medium">Quality certified</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.qualityOnly} tokens</p>
                <p className="text-xs text-gray-500">Applied to {data.tokenStats.qualityOnly} kg of honey</p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12">
                <div className="flex items-center mb-1">
                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                  <p className="text-sm font-medium">Origin and Quality certified</p>
                </div>
                <p className="text-xl font-bold">{data.tokenStats.bothCertifications * 2} tokens</p>
                <p className="text-xs text-gray-500">Applied to {data.tokenStats.bothCertifications} kg of honey</p>
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
      {/* Certification Evolution Chart Section */}
<div className="bg-white p-4 rounded-lg shadow text-black mb-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold">Certification Overview</h2>
    <div className="relative">
      <select 
        className="bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
      >
        <option value="Monthly">Monthly</option>
        <option value="Quarterly">Quarterly</option>
        <option value="Yearly">Yearly</option>
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>

  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={filteredBatches.reduce((acc, batch) => {
          // Extract month from certification date
          const month = batch.certificationDate ? 
            new Date(batch.certificationDate).toLocaleString('default', { month: 'short' }) : 'Unknown';
          
          // Find or create month entry
          let monthEntry = acc.find(entry => entry.month === month);
          if (!monthEntry) {
            monthEntry = { 
              month, 
              originOnly: 0, 
              qualityOnly: 0, 
              bothCertifications: 0, 
              uncertified: 0 
            };
            acc.push(monthEntry);
          }
          
          // Add batch data to month entry
          monthEntry.originOnly += Number(batch.originOnly || 0);
          monthEntry.qualityOnly += Number(batch.qualityOnly || 0);
          monthEntry.bothCertifications += Number(batch.bothCertifications || 0);
          monthEntry.uncertified += Number(batch.uncertified || 0);
          
          return acc;
        }, []).sort((a, b) => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(a.month) - months.indexOf(b.month);
        })}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="month" 
          tick={{ fill: '#6B7280', fontSize: 12 }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis 
          tick={{ fill: '#6B7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'white', 
            borderRadius: '0.375rem', 
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
          }}
          itemStyle={{ padding: '2px 0' }}
          formatter={(value) => [`${value} kg`, null]}
          labelFormatter={(label) => `${label}`}
        />
        <Legend 
          verticalAlign="top" 
          height={36}
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ paddingBottom: '10px' }}
        />
        <Line 
          type="monotone" 
          dataKey="originOnly" 
          name="Origin Certified" 
          stroke="#3B82F6" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="qualityOnly" 
          name="Quality Certified" 
          stroke="#10B981" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="bothCertifications" 
          name="Fully Certified" 
          stroke="#8B5CF6" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="uncertified" 
          name="Uncertified" 
          stroke="#9CA3AF" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  <div className="flex justify-between mt-4 border-t pt-4">
    <div className="text-center">
      <p className="text-gray-500">Origin Certified</p>
      <p className="text-2xl font-bold">
        {filteredBatches.reduce((total, batch) => total + Number(batch.originOnly || 0), 0)} kg
      </p>
    </div>
    <div className="text-center">
      <p className="text-gray-500">Quality Certified</p>
      <p className="text-2xl font-bold">
        {filteredBatches.reduce((total, batch) => total + Number(batch.qualityOnly || 0), 0)} kg
      </p>
    </div>
    <div className="text-center">
      <p className="text-gray-500">Fully Certified</p>
      <p className="text-2xl font-bold">
        {filteredBatches.reduce((total, batch) => total + Number(batch.bothCertifications || 0), 0)} kg
      </p>
    </div>
    <div className="text-center">
      <p className="text-gray-500">Uncertified</p>
      <p className="text-2xl font-bold">
        {filteredBatches.reduce((total, batch) => total + Number(batch.uncertified || 0), 0)} kg
      </p>
    </div>
  </div>
</div>

   {/* Batch Certification Status Section */}
<div className="bg-white p-4 rounded-lg shadow text-black">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold">Batch Certification Status</h2>
    <div className="flex items-center">
      <div className="relative mr-2">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input 
          type="text" 
          placeholder="Search batches..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 w-full" 
        />
      </div>
      <button 
        onClick={() => setShowAllBatches(!showAllBatches)} 
        className="text-blue-600 hover:text-blue-800 text-sm"
      >
        {showAllBatches ? 'Show Less' : `Show All (${filteredBatches.length})`}
      </button>
    </div>
  </div>

  {/* Inventory Detail Modal */}
  {selectedItem && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30" onClick={() => setSelectedItem(null)}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Inventory Details</h3>
          <button 
            onClick={() => setSelectedItem(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-500">Batch Name</p>
              <p className="font-medium">{selectedItem.batchName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">{selectedItem.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-medium">{selectedItem.weight} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jars</p>
              <p className="font-medium">{selectedItem.jars}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Container Type</p>
              <p className="font-medium">{selectedItem.containerType || "Glass"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Label Type</p>
              <p className="font-medium">{selectedItem.labelType || "Premium"}</p>
            </div>
          </div>
          
          {/* Additional inventory details */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Stock Level</span>
              <span className="text-sm font-medium">
                {selectedItem.stockLevel || "In Stock"}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Location</span>
              <span className="text-sm font-medium">
                {selectedItem.location || "Warehouse A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium">
                {selectedItem.lastUpdated || new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setSelectedItem(null)}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 text-sm"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Handle view full inventory details logic here
              setSelectedItem(null);
              // Can redirect to inventory page with this item selected
            }}
            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
          >
            View in Inventory
          </button>
        </div>
      </div>
    </div>
  )}

  <div className="space-y-2">
    {displayedBatches.length > 0 ? (
      displayedBatches.map((batch) => (
        <div key={batch.id} className="border rounded-lg bg-gray-50 overflow-hidden">
          {/* Batch header */}
          <div 
            className="p-3 bg-gray-100 cursor-pointer flex justify-between items-center"
            onClick={() => toggleBatchExpansion(batch.id)}
          >
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                batch.status === "Closed" || 
                (batch.status === "Certified" || batch.status === "Rejected") && batch.completedChecks === batch.totalChecks 
                  ? "bg-green-500" : "bg-yellow-500"
              }`}></span>
              <span className="font-medium">{batch.name}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-3">
                {batch.status === "Certified" || batch.status === "Rejected" || batch.status === "In Progress" ? 
                  (batch.completedChecks === batch.totalChecks ? "Closed" : "Pending") : 
                  batch.status}
              </span>
              <svg 
                className={`w-4 h-4 transform transition-transform ${expandedBatches.includes(batch.id) ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Expanded content */}
          {expandedBatches.includes(batch.id) && (
            <div className="p-4 border-t">
              {/* Batch metadata */}
              <div className="flex justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">Batch ID</p>
                  <p className="font-medium">{batch.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Certification Date</p>
                  <p className="font-medium">{batch.certificationDate || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="font-medium">{batch.expiryDate || "-"}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Certification Progress</span>
                  <span className="text-sm font-medium">{batch.completedChecks}/{batch.totalChecks} Checks</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      batch.completedChecks === batch.totalChecks ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    style={{ width: `${(batch.completedChecks / batch.totalChecks) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Certification data & pie chart with arrow indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Chart section with arrow indicators */}
                <div>
                  <div className="text-center mb-2">
                    <h3 className="text-md font-semibold">Total Kilograms: {batch.totalKg || "1000"}</h3>
                    <p className="text-xs text-gray-500">Jars used: {batch.jarsUsed || "400"}</p>
                  </div>
                  <div className="h-48 flex items-center justify-center">
                    {/* SVG circle chart with arrow indicators */}
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#e5e7eb"
                          strokeWidth="16"
                        />
                        
                        {/* Origin Only - Blue segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#3b82f6" 
                          strokeWidth="16"
                          strokeDasharray={`${(batch.originOnlyPercent || 25) * 2.51} 251`}
                          strokeLinecap="butt"
                        />
                        
                        {/* Quality Only - Green segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="16"
                          strokeDasharray={`${(batch.qualityOnlyPercent || 10) * 2.51} 251`}
                          strokeDashoffset={`${-(batch.originOnlyPercent || 25) * 2.51}`}
                          strokeLinecap="butt"
                        />
                        
                        {/* Fully Certified - Purple segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#8b5cf6"
                          strokeWidth="16"
                          strokeDasharray={`${(batch.bothCertificationsPercent || 45) * 2.51} 251`}
                          strokeDashoffset={`${-((batch.originOnlyPercent || 25) + (batch.qualityOnlyPercent || 10)) * 2.51}`}
                          strokeLinecap="butt"
                        />
                        
                        {/* Uncertified - Gray segment */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#9ca3af"
                          strokeWidth="16"
                          strokeDasharray={`${(batch.uncertifiedPercent || 20) * 2.51} 251`}
                          strokeDashoffset={`${-((batch.originOnlyPercent || 25) + (batch.qualityOnlyPercent || 10) + (batch.bothCertificationsPercent || 45)) * 2.51}`}
                          strokeLinecap="butt"
                        />
                      </svg>
                      
                      {/* Center text display */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium">{batch.totalKg} kg</span>
                        <span className="text-xs text-gray-500">{batch.jarsUsed} jars</span>
                      </div>
                      
                      {/* Arrow indicators with percentages */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                        <span>↓</span>
                        <span className="ml-1">{batch.originOnlyPercent || 25}%</span>
                      </div>
                      
                      <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                        <span>←</span>
                        <span className="ml-1">{batch.qualityOnlyPercent || 10}%</span>
                      </div>
                      
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                        <span>↑</span>
                        <span className="ml-1">{batch.bothCertificationsPercent || 45}%</span>
                      </div>
                      
                      <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                        <span>→</span>
                        <span className="ml-1">{batch.uncertifiedPercent || 20}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certification stats */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-md font-semibold mb-3">Certification Progress</h3>
                  <div className="flex flex-wrap justify-between mb-4">
                    {[
                      {
                        color: "bg-blue-500",
                        label: "Origin Certified",
                        value: batch.originOnly || "250",
                        percent: batch.originOnlyPercent || "25",
                        jars: Math.round((batch.originOnly || 250) * (batch.jarsUsed || 400) / (batch.totalKg || 1000))
                      },
                      {
                        color: "bg-green-500",
                        label: "Quality Certified",
                        value: batch.qualityOnly || "100",
                        percent: batch.qualityOnlyPercent || "10",
                        jars: Math.round((batch.qualityOnly || 100) * (batch.jarsUsed || 400) / (batch.totalKg || 1000))
                      },
                      {
                        color: "bg-purple-500",
                        label: "Fully Certified",
                        value: batch.bothCertifications || "450",
                        percent: batch.bothCertificationsPercent || "45",
                        jars: Math.round((batch.bothCertifications || 450) * (batch.jarsUsed || 400) / (batch.totalKg || 1000))
                      },
                      {
                        color: "bg-gray-400",
                        label: "Uncertified",
                        value: batch.uncertified || "200",
                        percent: batch.uncertifiedPercent || "20",
                        jars: Math.round((batch.uncertified || 200) * (batch.jarsUsed || 400) / (batch.totalKg || 1000))
                      },
                    ].map((item, index) => (
                      <div 
                        key={index} 
                        className="p-3 bg-white rounded-lg shadow mb-2 w-full md:w-5/12 cursor-pointer transform transition-transform hover:scale-105 hover:shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem({
                            batchName: batch.name,
                            batchId: batch.id,
                            category: item.label,
                            weight: item.value,
                            jars: item.jars,
                            containerType: batch.containerType || "Glass",
                            labelType: batch.labelType || "Premium",
                            stockLevel: "In Stock",
                            location: item.label === "Uncertified" ? "Pending Area" : "Certified Storage",
                            lastUpdated: new Date().toLocaleDateString()
                          });
                        }}
                      >
                        <div className="flex items-center mb-1">
                          <div className={`h-3 w-3 rounded-full ${item.color} mr-2`}></div>
                          <p className="text-sm font-medium">{item.label}</p>
                        </div>
                        <p className="text-xl font-bold">{item.value} kg</p>
                        <p className="text-xs text-gray-500">{item.jars} jars · {item.percent}% of batch</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="mt-4 flex justify-end">
                <button className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 mr-2">
                  View Full Details
                </button>
                {batch.status === "Pending" && (
                  <button className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Approve
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))
    ) : (
      <div className="text-center py-8 text-gray-500">
        No batches match your search criteria
      </div>
    )}
  </div>

  {/* Show more button */}
  {filteredBatches.length > 3 && !showAllBatches && (
    <div className="mt-3 text-center">
      <button 
        onClick={() => setShowAllBatches(true)}
        className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
      >
        + Show {filteredBatches.length - 3} more batches
      </button>
    </div>
  )}
</div>

      {/* Buy Tokens Modal */}
      {showBuyTokensModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Buy More Tokens</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Tokens to Purchase
              </label>
              <input
                type="number"
                value={tokensToAdd}
                onChange={(e) => setTokensToAdd(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                min="1"
              />
            </div>
            <div className="mb-4">
              <p className="font-medium">Price: ${(tokensToAdd * 0.10).toFixed(2)} USD</p>
              <p className="text-sm text-gray-500">($0.10 per token)</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBuyTokensModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyTokens}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
);
}