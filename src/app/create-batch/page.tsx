'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import { Menu, X, Search, ChevronDown, ChevronUp, Printer, PlusCircle, Check, AlertCircle, MapPin, Package, RefreshCw, Filter, ArrowLeft, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function BatchesPage() {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPrintNotification, setShowPrintNotification] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastUpdated, setLastUpdated] = useState('--');
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [showProfileNotification, setShowProfileNotification] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({
    passportId: '',
    passportScan: null
  });
 useEffect(() => {
  // Format the current date for display - only runs on client after hydration
  const now = new Date();
  setLastUpdated(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
}, []);
  const [formData, setFormData] = useState({
    apiaries: [
      {
        name: '',
        number: '',
        hiveCount: 0,
        latitude: 0,
        longitude: 0,
        kilosCollected: 0
      }
    ]
  });

  // Sample batch data
  const [batches, setBatches] = useState([
    {
      id: 1,
      batchNumber: 'B-2025-001',
      name: 'January Organic Honey',
      status: 'completed',
      createdAt: '2025-01-15',
      totalKg: 1250,
      jarsProduced: 500,
      certificationStatus: {
        originOnly: 250,
        originOnlyPercent: 20,
        qualityOnly: 125,
        qualityOnlyPercent: 10,
        bothCertifications: 750,
        bothCertificationsPercent: 60,
        uncertified: 125,
        uncertifiedPercent: 10
      },
      apiaries: [
        {
          id: 1,
          name: 'Highland Meadows',
          number: 'AP001',
          hiveCount: 25,
          latitude: 45.678,
          longitude: -122.345,
          kilosCollected: 450
        },
        {
          id: 2,
          name: 'Valley Gardens',
          number: 'AP002',
          hiveCount: 40,
          latitude: 45.698,
          longitude: -122.367,
          kilosCollected: 800
        }
      ]
    },
    {
      id: 2,
      batchNumber: 'B-2025-002',
      name: 'February Wildflower Collection',
      status: 'pending',
      createdAt: '2025-02-10',
      totalKg: 980,
      jarsProduced: 392,
      certificationStatus: {
        originOnly: 300,
        originOnlyPercent: 30.6,
        qualityOnly: 150,
        qualityOnlyPercent: 15.3,
        bothCertifications: 180,
        bothCertificationsPercent: 18.4,
        uncertified: 350,
        uncertifiedPercent: 35.7
      },
      apiaries: []
    },
    {
      id: 3,
      batchNumber: 'B-2025-003',
      name: 'March Mountain Honey',
      status: 'pending',
      createdAt: '2025-03-05',
      totalKg: 1500,
      jarsProduced: 600,
      certificationStatus: {
        originOnly: 450,
        originOnlyPercent: 30,
        qualityOnly: 225,
        qualityOnlyPercent: 15,
        bothCertifications: 225,
        bothCertificationsPercent: 15,
        uncertified: 600,
        uncertifiedPercent: 40
      },
      apiaries: []
    },
    {
      id: 4,
      batchNumber: 'B-2025-004',
      name: 'Spring Specialty Blend',
      status: 'completed',
      createdAt: '2025-03-20',
      totalKg: 850,
      jarsProduced: 340,
      certificationStatus: {
        originOnly: 170,
        originOnlyPercent: 20,
        qualityOnly: 85,
        qualityOnlyPercent: 10,
        bothCertifications: 510,
        bothCertificationsPercent: 60,
        uncertified: 85,
        uncertifiedPercent: 10
      },
      apiaries: [
        {
          id: 3,
          name: 'Riverside Apiary',
          number: 'AP003',
          hiveCount: 30,
          latitude: 45.712,
          longitude: -122.401,
          kilosCollected: 850
        }
      ]
    },
    {
      id: 5,
      batchNumber: 'B-2025-005',
      name: 'April Dark Forest Honey',
      status: 'pending',
      createdAt: '2025-04-12',
      totalKg: 1000,
      jarsProduced: 400,
      certificationStatus: {
        originOnly: 100,
        originOnlyPercent: 10,
        qualityOnly: 50,
        qualityOnlyPercent: 5,
        bothCertifications: 150,
        bothCertificationsPercent: 15,
        uncertified: 700,
        uncertifiedPercent: 70
      },
      apiaries: []
    }
  ]);
  // Handle profile form changes
  const handleProfileChange = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleProfileChange('passportScan', file);
    }
  };

  // Handle profile completion form submission
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would save the profile data to a database
    setShowProfileForm(false);
    alert('Profile information updated successfully!');
  };
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle batch selection
  const toggleBatchSelection = (batchId) => {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter(id => id !== batchId));
    } else {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  };

  // Toggle select all batches
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedBatches([]);
    } else {
      setSelectedBatches(filteredBatches.map(batch => batch.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle print button click
  const handlePrint = () => {
    // Check if any of the selected batches are pending
    const anyPending = selectedBatches.some(
      batchId => batches.find(batch => batch.id === batchId).status === 'pending'
    );
    
    if (anyPending) {
      setShowPrintNotification(true);
    } else {
      // Mock printing functionality
      window.alert('Printing batch certificates...');
    }
  };

  // Handle batch completion
  const handleCompleteBatch = (e) => {
    e.preventDefault();

    // Update the batches with the form data
    const updatedBatches = batches.map(batch => {
      if (selectedBatches.includes(batch.id)) {
        return {
          ...batch,
          status: 'completed',
          apiaries: [...formData.apiaries]
        };
      }
      return batch;
    });

    setBatches(updatedBatches);
    setShowCompleteForm(false);
    setShowPrintNotification(false);
    setSelectedBatches([]);
    setSelectAll(false);
    setShowProfileNotification(true);
    
    // Show success message
    alert('Batches successfully completed and associated with apiaries.');
  };

  // Handle adding a new apiary to the form
  const addApiary = () => {
    setFormData({
      ...formData,
      apiaries: [
        ...formData.apiaries,
        {
          name: '',
          number: '',
          hiveCount: 0,
          latitude: 0,
          longitude: 0,
          kilosCollected: 0
        }
      ]
    });
  };

  // Handle removing an apiary from the form
  const removeApiary = (index) => {
    if (formData.apiaries.length === 1) return;
    
    const updatedApiaries = [...formData.apiaries];
    updatedApiaries.splice(index, 1);
    
    setFormData({
      ...formData,
      apiaries: updatedApiaries
    });
  };

  // Handle apiary form field changes
  const handleApiaryChange = (index, field, value) => {
  const newApiaries = [...formData.apiaries];
  
  // For numeric fields, handle empty values properly
  if (['hiveCount', 'kilosCollected', 'latitude', 'longitude'].includes(field)) {
    // Convert to number if value exists, otherwise use 0 or empty string
    // This prevents NaN values
    newApiaries[index][field] = value === '' ? (field === 'kilosCollected' || field === 'hiveCount' ? 0 : '') : Number(value);
  } else {
    newApiaries[index][field] = value;
  }
  
  setFormData({
    ...formData,
    apiaries: newApiaries
  });
};
  // Filter and sort batches
  const filteredBatches = batches
    .filter(batch => {
      const matchesSearch = 
        batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return filterStatus === 'all' 
        ? matchesSearch 
        : matchesSearch && batch.status === filterStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });

  // Handle refresh data
  const refreshData = () => {
    // In a real application, this would fetch fresh data from the API
    setLastUpdated(new Date().toLocaleString());
  };

  // Certification pie chart data for a specific batch
  const getCertificationData = (batch) => [
    { name: 'Origin Only', value: batch.certificationStatus.originOnly, color: '#3182CE' },
    { name: 'Quality Only', value: batch.certificationStatus.qualityOnly, color: '#38A169' },
    { name: 'Both Certifications', value: batch.certificationStatus.bothCertifications, color: '#805AD5' },
    { name: 'Uncertified', value: batch.certificationStatus.uncertified, color: '#CBD5E0' }
  ];
  const toggleExpand = (batchId) => {
  if (expandedBatch === batchId) {
    setExpandedBatch(null); // Collapse if already expanded
  } else {
    setExpandedBatch(batchId); // Expand the clicked batch
  }
};
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
              <a href="/" className="flex items-center px-4 py-3 hover:bg-gray-700">
                <ArrowLeft className="h-5 w-5 mr-3" />
                Back to Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 bg-gray-700">
                <Package className="h-5 w-5 mr-3" />
                Batches
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

      {/* Header */}
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">HoneyCertify</h1>
                <p className="text-sm text-gray-500">Batch Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full"
              title="Refresh data"
            >
              <RefreshCw className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedBatches.length === 0}
              className={`flex items-center px-4 py-2 rounded ${
                selectedBatches.length === 0 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print {selectedBatches.length > 0 ? `(${selectedBatches.length})` : ''}
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Last updated: {lastUpdated}
        </p>
      </header>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center">
            <div className="relative mr-4 w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="batchNumber">Batch Number</option>
              <option value="totalKg">Total Kilograms</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {sortOrder === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Batch list table */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="w-12 py-3 pl-4">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-yellow-600 rounded focus:ring-yellow-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total (kg)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jars
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apiaries
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {filteredBatches.map((batch) => (
  <React.Fragment key={batch.id}>
    <tr 
      className={`hover:bg-gray-50 ${selectedBatches.includes(batch.id) ? 'bg-yellow-50' : ''}`}
    >
      <td className="py-3 pl-4">
        <input
          type="checkbox"
          checked={selectedBatches.includes(batch.id)}
          onChange={() => toggleBatchSelection(batch.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 text-yellow-600 rounded focus:ring-yellow-500"
        />
      </td>
      <td 
        className="px-4 py-3 cursor-pointer" 
        onClick={() => toggleExpand(batch.id)}
      >
        {batch.batchNumber}
      </td>
      <td 
        className="px-4 py-3 cursor-pointer"
        onClick={() => toggleExpand(batch.id)}
      >
        {batch.name}
      </td>
      <td 
        className="px-4 py-3 cursor-pointer"
        onClick={() => toggleExpand(batch.id)}
      >
        {new Date(batch.createdAt).toLocaleDateString()}
      </td>
      <td 
        className="px-4 py-3 cursor-pointer"
        onClick={() => toggleExpand(batch.id)}
      >
        <span
          className={`inline-flex px-2 py-1 text-xs rounded-full ${
            batch.status === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {batch.status === 'completed' ? 'Completed' : 'Pending'}
        </span>
      </td>
      <td 
        className="px-4 py-3 cursor-pointer"
        onClick={() => toggleExpand(batch.id)}
      >
        {batch.totalKg.toLocaleString()}
      </td>
      <td 
        className="px-4 py-3 cursor-pointer"
        onClick={() => toggleExpand(batch.id)}
      >
        {batch.jarsProduced.toLocaleString()}
      </td>
      <td 
        className="px-4 py-3 cursor-pointer"
        onClick={() => toggleExpand(batch.id)}
      >
        {batch.apiaries.length || 0}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(batch.id);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          {expandedBatch === batch.id ? 'Hide Details' : 'View Details'}
        </button>
      </td>
    </tr>


    {/* Expanded batch details row */}
    {expandedBatch === batch.id && (
      <tr>
        <td colSpan="9" className="px-4 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Certification pie chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold mb-2">Certification Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCertificationData(batch)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {getCertificationData(batch).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} kg`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Batch details */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold mb-2">Batch Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch Number:</span>
                  <span className="font-medium">{batch.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created Date:</span>
                  <span className="font-medium">{new Date(batch.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Weight:</span>
                  <span className="font-medium">{batch.totalKg.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jars Produced:</span>
                  <span className="font-medium">{batch.jarsProduced.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${batch.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {batch.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Apiaries information */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-semibold mb-2">Associated Apiaries</h3>
              {batch.apiaries.length > 0 ? (
                <div className="space-y-3">
                  {batch.apiaries.map((apiary, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{apiary.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number:</span>
                        <span className="font-medium">{apiary.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hives:</span>
                        <span className="font-medium">{apiary.hiveCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collected:</span>
                        <span className="font-medium">{apiary.kilosCollected} kg</span>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {apiary.latitude.toFixed(4)}, {apiary.longitude.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>No apiaries associated</p>
                  {batch.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedBatches([batch.id]);
                        setShowCompleteForm(true);
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Complete batch info
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    )}
  </React.Fragment>
))}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    No batches found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print notification modal */}
      {showPrintNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold">Incomplete Batch Information</h3>
            </div>
            <p className="mb-4 text-gray-600">
              One or more selected batches are missing apiary information and cannot be printed. Would you like to complete the missing information now?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPrintNotification(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPrintNotification(false);
                  setShowCompleteForm(true);
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                Complete Information
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Complete batch form modal */}
      {showCompleteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Complete Batch Information</h3>
              <button 
                onClick={() => setShowCompleteForm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCompleteBatch}>
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Selected Batches</h4>
                <div className="p-3 bg-gray-50 rounded-md">
                  <ul className="list-disc pl-5 space-y-1">
                    {batches
                      .filter(batch => selectedBatches.includes(batch.id))
                      .map(batch => (
                        <li key={batch.id} className="text-gray-700">
                          {batch.batchNumber} - {batch.name} ({batch.totalKg} kg)
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold">Associated Apiaries</h4>
                  <button
                    type="button"
                    onClick={addApiary}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Apiary
                  </button>
                </div>
                
                {formData.apiaries.map((apiary, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium">Apiary #{index + 1}</h5>
                      {formData.apiaries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeApiary(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apiary Name
                        </label>
                        <input
                          type="text"
                          value={apiary.name}
                          onChange={(e) => handleApiaryChange(index, 'name', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="Mountain View Apiary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apiary Number
                        </label>
                        <input
                          type="text"
                          value={apiary.number}
                          onChange={(e) => handleApiaryChange(index, 'number', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="AP001"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Hives
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={apiary.hiveCount}
                          onChange={(e) => handleApiaryChange(index, 'hiveCount', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kilos Collected
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={apiary.kilosCollected}
                          onChange={(e) => handleApiaryChange(index, 'kilosCollected', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={apiary.latitude}
                          onChange={(e) => handleApiaryChange(index, 'latitude', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="45.678"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={apiary.longitude}
                          onChange={(e) => handleApiaryChange(index, 'longitude', e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="-122.345"
                        />
                      </div>
                    </div>

                    {/* Map placeholder */}
                    <div className="mt-4 p-2 bg-gray-200 h-40 rounded flex items-center justify-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <MapPin className="h-6 w-6 mb-2" />
                        <span>Map would appear here in production</span>
                        <span className="text-xs mt-1">Coordinates: {apiary.latitude.toFixed(4)}, {apiary.longitude.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Validation check for total kilos */}
              {(() => {
                const totalKilosCollected = formData.apiaries.reduce((sum, apiary) => sum + apiary.kilosCollected, 0);
                const selectedBatchesTotal = batches
                  .filter(batch => selectedBatches.includes(batch.id))
                  .reduce((sum, batch) => sum + batch.totalKg, 0);
                
                return totalKilosCollected > selectedBatchesTotal ? (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Warning: Collection amount exceeds batch total</p>
                        <p>The total kilos collected from apiaries ({totalKilosCollected} kg) exceeds the total batch amount ({selectedBatchesTotal} kg).</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCompleteForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Complete Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
       {/* Profile completion notification modal */}
      {showProfileNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold">Profile Incomplete</h3>
            </div>
            <p className="mb-4 text-gray-600">
              To ensure compliance with certification standards, please complete your profile by providing your passport ID and a scan of your passport. This information is required for audit purposes.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowProfileNotification(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Later
              </button>
              <button
                onClick={() => {
                  setShowProfileNotification(false);
                  setShowProfileForm(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Complete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile completion form modal */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Complete Your Profile</h3>
              <button 
                onClick={() => setShowProfileForm(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleProfileSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport ID
                </label>
                <input
                  type="text"
                  value={profileData.passportId}
                  onChange={(e) => handleProfileChange('passportId', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your passport ID"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passport Scan
                </label>
                <div className="mt-1 flex items-center">
                  {profileData.passportScan ? (
                    <div className="bg-gray-100 p-3 rounded-md w-full flex justify-between items-center">
                      <span className="text-sm text-gray-700">{profileData.passportScan.name}</span>
                      <button
                        type="button"
                        onClick={() => handleProfileChange('passportScan', null)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-md shadow-sm border border-gray-300 border-dashed cursor-pointer hover:bg-gray-50">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-600">
                        Upload a scan of your passport
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        PNG, JPG or PDF up to 10MB
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileUpload}
                        required
                      />
                    </label>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Your passport information is securely stored and only used for certification verification purposes.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProfileForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Statistics summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Batches</h3>
          <p className="text-2xl font-bold text-gray-800">{batches.length}</p>
          <div className="flex items-center mt-2 text-sm">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(batches.filter(b => b.status === 'completed').length / batches.length) * 100}%` }}
              ></div>
            </div>
            <span className="ml-2 text-gray-600">
              {Math.round((batches.filter(b => b.status === 'completed').length / batches.length) * 100)}% Complete
            </span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Weight</h3>
          <p className="text-2xl font-bold text-gray-800">
            {batches.reduce((sum, batch) => sum + batch.totalKg, 0).toLocaleString()} kg
          </p>
          <p className="text-sm text-gray-600 mt-2">
            From {batches.filter(b => b.status === 'completed').reduce((sum, batch) => sum + batch.apiaries.length, 0)} apiaries
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Jars Produced</h3>
          <p className="text-2xl font-bold text-gray-800">
            {batches.reduce((sum, batch) => sum + batch.jarsProduced, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Across {batches.length} batches
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Certification Rate</h3>
          <p className="text-2xl font-bold text-gray-800">
            {Math.round(
              (batches.reduce((sum, batch) => sum + batch.certificationStatus.bothCertifications, 0) / 
              batches.reduce((sum, batch) => sum + batch.totalKg, 0)) * 100
            )}%
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Fully certified honey
          </p>
        </div>
      </div>

      {/* Certification breakdown chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Overall Certification Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: 'Origin Only',
                  value: batches.reduce((sum, batch) => sum + batch.certificationStatus.originOnly, 0),
                  color: '#3182CE'
                },
                {
                  name: 'Quality Only',
                  value: batches.reduce((sum, batch) => sum + batch.certificationStatus.qualityOnly, 0),
                  color: '#38A169'
                },
                {
                  name: 'Both Certifications',
                  value: batches.reduce((sum, batch) => sum + batch.certificationStatus.bothCertifications, 0),
                  color: '#805AD5'
                },
                {
                  name: 'Uncertified',
                  value: batches.reduce((sum, batch) => sum + batch.certificationStatus.uncertified, 0),
                  color: '#CBD5E0'
                }
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} kg`} />
              <Legend />
              <Bar dataKey="value" name="Weight (kg)">
                {[
                  { name: 'Origin Only', color: '#3182CE' },
                  { name: 'Quality Only', color: '#38A169' },
                  { name: 'Both Certifications', color: '#805AD5' },
                  { name: 'Uncertified', color: '#CBD5E0' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}