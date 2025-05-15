'use client'

import { useState, useEffect } from 'react';
import { Wallet, Menu, X, Home, Settings, Users, Activity, HelpCircle, Package, Tag, Layers, PlusCircle, Printer, ArrowLeft, Search, Filter } from 'lucide-react';

// Mock data for inventory page
const initialData = {
  batches: [
    { 
      id: 'B1001', 
      name: 'Spring Honey Collection',
      containerType: 'Glass', 
      labelType: 'Premium', 
      weightKg: 50, 
      date: '2025-05-10',
      status: 'Certified',
      completedChecks: 8,
      totalChecks: 8,
      totalKg: 450,
      jarsUsed: 225,
      originOnly: 90,
      originOnlyPercent: 20,
      qualityOnly: 45,
      qualityOnlyPercent: 10,
      bothCertifications: 270,
      bothCertificationsPercent: 60,
      uncertified: 45,
      uncertifiedPercent: 10
    },
    { 
      id: 'B1002', 
      name: 'Summer Wildflower Blend',
      containerType: 'Plastic', 
      labelType: 'Standard', 
      weightKg: 75, 
      date: '2025-05-11',
      status: 'Pending',
      completedChecks: 5,
      totalChecks: 8,
      totalKg: 560,
      jarsUsed: 224,
      originOnly: 168,
      originOnlyPercent: 30,
      qualityOnly: 84,
      qualityOnlyPercent: 15,
      bothCertifications: 84,
      bothCertificationsPercent: 15,
      uncertified: 224,
      uncertifiedPercent: 40
    },
    { 
      id: 'B1003', 
      name: 'Mountain Forest Special',
      containerType: 'Metal', 
      labelType: 'Custom', 
      weightKg: 30, 
      date: '2025-05-12',
      status: 'In Progress',
      completedChecks: 3,
      totalChecks: 8,
      totalKg: 350,
      jarsUsed: 175,
      originOnly: 105,
      originOnlyPercent: 30,
      qualityOnly: 70,
      qualityOnlyPercent: 20,
      bothCertifications: 122.5,
      bothCertificationsPercent: 35,
      uncertified: 52.5,
      uncertifiedPercent: 15
    },
    { 
      id: 'B1004', 
      name: 'Organic Alpine Harvest',
      containerType: 'Glass', 
      labelType: 'Standard', 
      weightKg: 65, 
      date: '2025-05-13',
      status: 'Certified',
      completedChecks: 8,
      totalChecks: 8,
      totalKg: 520,
      jarsUsed: 260,
      originOnly: 104,
      originOnlyPercent: 20,
      qualityOnly: 52,
      qualityOnlyPercent: 10,
      bothCertifications: 312,
      bothCertificationsPercent: 60,
      uncertified: 52,
      uncertifiedPercent: 10
    },
    { 
      id: 'B1005', 
      name: 'Autumn Harvest',
      containerType: 'Glass', 
      labelType: 'Premium', 
      weightKg: 85, 
      date: '2025-05-14',
      status: 'Rejected',
      completedChecks: 6,
      totalChecks: 8,
      totalKg: 580,
      jarsUsed: 232,
      originOnly: 58,
      originOnlyPercent: 10,
      qualityOnly: 29,
      qualityOnlyPercent: 5,
      bothCertifications: 87,
      bothCertificationsPercent: 15,
      uncertified: 406,
      uncertifiedPercent: 70
    }
  ],
  tokenStats: {
    totalTokens: 1000,
    originOnly: 100,
    qualityOnly: 100,
    bothCertifications: 100,
    remainingTokens: 700,
    totalKg: 2000
  }
};

export default function InventoryPage() {
  const [data, setData] = useState(initialData);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // Default sort by date
  const [sortOrder, setSortOrder] = useState('desc'); // Default sort newest first
  const [filterStatus, setFilterStatus] = useState('all'); // Default show all statuses

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleBatchClick = (batch) => {
    setSelectedBatch(batch);
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    // In a real app, this would trigger the printing functionality
    alert(`Preparing to print batch ${selectedBatch.id} - ${selectedBatch.name}`);
    // Simulate printing
    setTimeout(() => {
      setShowPrintModal(false);
      setSelectedBatch(null);
    }, 1500);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field, default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort batches
  const filteredAndSortedBatches = data.batches
    .filter(batch => {
      // Apply status filter first
      if (filterStatus !== 'all' && batch.status.toLowerCase() !== filterStatus.toLowerCase()) {
        return false;
      }
      
      // Then apply search term filter
      return (
        batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.containerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.labelType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'weight':
          comparison = a.weightKg - b.weightKg;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="/inventory" className="flex items-center px-4 py-3 bg-gray-700">
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
                <div className="flex items-center">
                  <a href="/dashboard" className="flex items-center text-sm text-blue-600 hover:underline">
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Back to Dashboard
                  </a>
                </div>
              </div>
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
                className="ml-3 p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Buy
              </button>
            </div>
            <button
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Batch
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="bg-white p-4 rounded-lg shadow text-black">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Inventory Management</h2>
          
          <div className="flex space-x-3">
            {/* Status filter dropdown */}
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">All Statuses</option>
              <option value="certified">Certified</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="rejected">Rejected</option>
            </select>
            
            {/* Search box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Batch listing */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th 
                  className="py-3 px-4 text-left font-medium text-gray-600 cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    Batch ID
                    {sortBy === 'id' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-left font-medium text-gray-600 cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Container</th>
                <th 
                  className="py-3 px-4 text-left font-medium text-gray-600 cursor-pointer"
                  onClick={() => handleSort('weight')}
                >
                  <div className="flex items-center">
                    Weight (kg)
                    {sortBy === 'weight' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-left font-medium text-gray-600 cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Created Date
                    {sortBy === 'date' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-left font-medium text-gray-600 cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === 'status' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Certification</th>
                <th className="py-3 px-4 text-center font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedBatches.length > 0 ? (
                filteredAndSortedBatches.map((batch) => (
                  <tr 
                    key={batch.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer" 
                    onClick={() => handleBatchClick(batch)}
                  >
                    <td className="py-3 px-4">{batch.id}</td>
                    <td className="py-3 px-4 font-medium">{batch.name}</td>
                    <td className="py-3 px-4">{batch.containerType}</td>
                    <td className="py-3 px-4">{batch.weightKg}</td>
                    <td className="py-3 px-4">{batch.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        batch.status === 'Certified' ? 'bg-green-100 text-green-800' : 
                        batch.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        batch.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            batch.status === 'Certified' ? 'bg-green-500' :
                            batch.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${(batch.completedChecks / batch.totalChecks) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 text-center">
                        {batch.completedChecks}/{batch.totalChecks}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center mx-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBatchClick(batch);
                        }}
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">
                    No batches found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Batch count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredAndSortedBatches.length} of {data.batches.length} batches
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && selectedBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Print Batch Certificate</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Batch ID</p>
                  <p className="font-medium">{selectedBatch.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedBatch.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Container Type</p>
                  <p className="font-medium">{selectedBatch.containerType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Label Type</p>
                  <p className="font-medium">{selectedBatch.labelType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium">{selectedBatch.weightKg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Creation Date</p>
                  <p className="font-medium">{selectedBatch.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{selectedBatch.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Certification Progress</p>
                  <p className="font-medium">{selectedBatch.completedChecks}/{selectedBatch.totalChecks} Checks</p>
                </div>
              </div>

              {/* Certification distribution */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Certification Distribution</h4>
                <div className="flex mb-1">
                  <div className="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden">
                    <div 
                      className="bg-blue-500 h-4" 
                      style={{ width: `${selectedBatch.originOnlyPercent}%` }}
                      title={`Origin Certified: ${selectedBatch.originOnly}kg (${selectedBatch.originOnlyPercent}%)`}
                    ></div>
                    <div 
                      className="bg-green-500 h-4" 
                      style={{ width: `${selectedBatch.qualityOnlyPercent}%` }}
                      title={`Quality Certified: ${selectedBatch.qualityOnly}kg (${selectedBatch.qualityOnlyPercent}%)`}
                    ></div>
                    <div 
                      className="bg-purple-500 h-4" 
                      style={{ width: `${selectedBatch.bothCertificationsPercent}%` }}
                      title={`Both Certifications: ${selectedBatch.bothCertifications}kg (${selectedBatch.bothCertificationsPercent}%)`}
                    ></div>
                    <div 
                      className="bg-gray-400 h-4" 
                      style={{ width: `${selectedBatch.uncertifiedPercent}%` }}
                      title={`Uncertified: ${selectedBatch.uncertified}kg (${selectedBatch.uncertifiedPercent}%)`}
                    ></div>
                  </div>
                </div>
                <div className="flex text-xs justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-blue-500 rounded-full mr-1"></div>
                    <span>Origin: {selectedBatch.originOnlyPercent}%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-1"></div>
                    <span>Quality: {selectedBatch.qualityOnlyPercent}%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-purple-500 rounded-full mr-1"></div>
                    <span>Both: {selectedBatch.bothCertificationsPercent}%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-gray-400 rounded-full mr-1"></div>
                    <span>None: {selectedBatch.uncertifiedPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Print Options</h4>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="printType" value="certificate" className="mr-2" defaultChecked />
                  <span>Certificate</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="printType" value="labels" className="mr-2" />
                  <span>Jar Labels</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="printType" value="report" className="mr-2" />
                  <span>Full Report</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedBatch(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}