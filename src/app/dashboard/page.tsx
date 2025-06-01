'use client'

import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Layers, Database, Tag, Package, RefreshCw, Menu, X, Home, Settings, Users, Activity, HelpCircle, Wallet, PlusCircle, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define your interfaces here, right after imports
interface TokenStats {
  originOnly: number;
  qualityOnly: number;
  bothCertifications: number;
  remainingTokens: number;
  totalTokens: number;
}

interface ApiaryLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}
interface CertifiedHoneyWeight {
  originOnly: number;
  qualityOnly: number;
  bothCertifications: number;
}

interface BatchData {
  id?: string;
  batchNumber?: string;
  status?: string;
  completedChecks?: number;
  totalChecks?: number;
  certificationDate?: string | null;
  expiryDate?: string | null;
  weightKg?: number;
  jarsUsed?: number;
  originOnly?: number;
  qualityOnly?: number;
  bothCertifications?: number;
  uncertified?: number;
  containerType?: string;
  labelType?: string;
  [key: string]: any; // Allow for other properties
}

interface ProcessedBatch {
  id: string;
  name: string;
  status: string;
  completedChecks: number;
  totalChecks: number;
  certificationDate: string | null;
  expiryDate: string | null;
  totalKg: number;
  jarsUsed: number;
  originOnly: number;
  qualityOnly: number;
  bothCertifications: number;
  uncertified: number;
  containerType: string;
  labelType: string;
  originOnlyPercent: number;
  qualityOnlyPercent: number;
  bothCertificationsPercent: number;
  uncertifiedPercent: number;
}

interface AppData {
  containers: any[];
  labels: any[];
  batches: BatchData[];
  tokenStats: TokenStats;
  certifiedHoneyWeight: CertifiedHoneyWeight;
}



// Mock data - in a real implementation, this would come from your backend microservices
const initialData: AppData = {
  containers: [],
  labels: [],
  batches: [],
  tokenStats: {
    originOnly: 0,
    qualityOnly: 0,
    bothCertifications: 0,
    remainingTokens: 0,
    totalTokens: 0
  },
  certifiedHoneyWeight: {
    originOnly: 0,
    qualityOnly: 0,
    bothCertifications: 0
  }
};

// Token certification distribution data
const tokenDistributionData = [];




// Honey certification status data
const honeyStatusData = [];

// A microservice dashboard for jar inventory management
export default function JarManagementDashboard() {
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token] = useState("HCT-73829-ABC45"); // Placeholder token
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBuyTokensModal, setShowBuyTokensModal] = useState(false);
  const [tokensToAdd, setTokensToAdd] = useState(100);
  // Add these state variables to your existing component
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleMapsApiKey = "AIzaSyBhRpOpnKWIXGMOTsdVoGKAnAC94Q0Sgxc"; 
  const [savedApiaryLocations, setSavedApiaryLocations] = useState<ApiaryLocation[]>([]);
  // 1. Add clickPosition state to track where user clicked for bubble positioning
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [batchFormData, setBatchFormData] = useState({
    apiaries: [
      {
        name: '',
        number: '',
        hiveCount: 0,
        kilosCollected: 0
      }
    ],
    containerType: 'Glass',
    labelType: 'Standard',
    weightKg: 10,
    weights: {
      originOnly: 0,
      qualityOnly: 0,
      bothCertifications: 0
    }
  });
  const [batchNumber, setBatchNumber] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [batchName, setBatchName] = useState(''); // Added batch name field
  const addApiary = () => {
    setBatchFormData({
      ...batchFormData,
      apiaries: [
        ...batchFormData.apiaries,
        {
          name: '',
          number: '',
          hiveCount: 0,
          kilosCollected: 0
        }
      ]
    });
  };

  const removeApiary = (index: number) => {
    const updatedApiaries = [...batchFormData.apiaries];
    updatedApiaries.splice(index, 1);
    setBatchFormData({
      ...batchFormData,
      apiaries: updatedApiaries
    });
  };
  const [isSaving, setIsSaving] = useState(false);

  

// 3. Function to fetch saved apiary locations
const fetchSavedApiaryLocations = async () => {
  try {
    const response = await fetch('/api/apiaries/locations');
    if (response.ok) {
      const locations = await response.json();
      setSavedApiaryLocations(locations);
    }
  } catch (error) {
    console.error('Error fetching apiary locations:', error);
  }
};

// 4. Call fetchSavedApiaryLocations on component mount
useEffect(() => {
  fetchSavedApiaryLocations();
}, []);


  // Add state to track token balance
const [tokenBalance, setTokenBalance] = useState(0); // Start with 0
  const handleApiaryChange = (
  index: number,
  field: keyof typeof batchFormData.apiaries[number],
  value: string | number
) => {
  const updatedApiaries = [...batchFormData.apiaries];
  updatedApiaries[index] = {
    ...updatedApiaries[index],
    [field]: value
  };
  setBatchFormData({
    ...batchFormData,
    apiaries: updatedApiaries
  });
};

  
 useEffect(() => {
  // Function to fetch data from API
  

  const fetchData = async () => {
    setLoading(true);
    try {
      // Initialize with default values to prevent null reference errors
      const defaultData = {
        containers: [],
        labels: [],
        batches: [],
        tokenStats: {
          originOnly: 0,
          qualityOnly: 0,
          bothCertifications: 0,
          remainingTokens: 0,
          totalTokens: 0
        },
        certifiedHoneyWeight: {
          originOnly: 0,
          qualityOnly: 0,
          bothCertifications: 0
        }
      };

      let data = defaultData;
      
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authtoken');
        
        if (token) {
          // Only attempt to fetch if a token exists
          const response = await fetch('/api/batches', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const fetchedData = await response.json();
            console.log('API response:', fetchedData);
            console.log('Batches received:', fetchedData.batches);
            // Merge with default data to ensure all properties exist
            data = {
              ...defaultData,
              ...fetchedData,
              tokenStats: {
                ...defaultData.tokenStats,
                ...(fetchedData.tokenStats || {})
              },
              certifiedHoneyWeight: {
                ...defaultData.certifiedHoneyWeight,
                ...(fetchedData.certifiedHoneyWeight || {})
              }
            };
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch data');
          }
        } else {
          console.log('No auth token found, using mock data');
          // Use mock data if no token exists - useful for development
          // You can add more mock data here if needed
          data = {
            ...defaultData,
            batches: allBatches
          };
        }
      } catch (error) {
        console.error('Error fetching from API:', error);
        // Fallback to default data structure
      }

      // Ensure tokenStats and certifiedHoneyWeight exist
      data.tokenStats = data.tokenStats || defaultData.tokenStats;
      data.certifiedHoneyWeight = data.certifiedHoneyWeight || defaultData.certifiedHoneyWeight;

      const newTokenDistributionData = [
        { 
          name: 'Origin Certified', 
          value: data.tokenStats.originOnly || 0, 
          color: '#3B82F6' 
        },
        { 
          name: 'Quality Certified', 
          value: data.tokenStats.qualityOnly || 0, 
          color: '#10B981' 
        },
        { 
          name: 'Fully Certified', 
          value: (data.tokenStats.bothCertifications || 0) * 2, 
          color: '#8B5CF6' 
        },
        { 
          name: 'Remaining', 
          value: data.tokenStats.remainingTokens || 0, 
          color: '#9CA3AF' 
        },
      ];

      const totalHoney =
        (data.certifiedHoneyWeight.originOnly || 0) +
        (data.certifiedHoneyWeight.qualityOnly || 0) +
        (data.certifiedHoneyWeight.bothCertifications || 0) +
        (data.batches || []).reduce((sum, batch) => sum + (batch.uncertified || 0), 0);

      const newHoneyStatusData = [
        {
          name: 'Origin Certified',
          value: data.certifiedHoneyWeight.originOnly || 0,
          percentage:
            totalHoney > 0
              ? Math.round(((data.certifiedHoneyWeight.originOnly || 0) / totalHoney) * 100)
              : 0,
          color: '#3B82F6',
        },
        {
          name: 'Quality Certified',
          value: data.certifiedHoneyWeight.qualityOnly || 0,
          percentage:
            totalHoney > 0
              ? Math.round(((data.certifiedHoneyWeight.qualityOnly || 0) / totalHoney) * 100)
              : 0,
          color: '#10B981',
        },
        {
          name: 'Fully Certified',
          value: data.certifiedHoneyWeight.bothCertifications || 0,
          percentage:
            totalHoney > 0
              ? Math.round(((data.certifiedHoneyWeight.bothCertifications || 0) / totalHoney) * 100)
              : 0,
          color: '#8B5CF6',
        },
        {
          name: 'Uncertified',
          value: (data.batches || []).reduce((sum, batch) => sum + (batch.uncertified || 0), 0),
          percentage:
            totalHoney > 0
              ? Math.round(
                  ((data.batches || []).reduce((sum, batch) => sum + (batch.uncertified || 0), 0) /
                    totalHoney) *
                    100
                )
              : 0,
          color: '#9CA3AF',
        },
      ];

      setData(data);
      setTokenDistributionData(newTokenDistributionData);
      setHoneyStatusData(newHoneyStatusData);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Error in fetchData:', error);
      setNotification({
        show: true,
        message: `Error: ${error.message}`,
      });

      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  fetchData();
  
  // Set up a refresh interval (optional)
  // const intervalId = setInterval(fetchData, 60000); // Refresh every minute
  // return () => clearInterval(intervalId); // Clean up on unmount 
}, []);  // Empty dependency array means this effect runs once on mount

// Define these functions outside of useEffect
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

  const createBatch = async () => {
  setLoading(true);
  
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found. Please log in again.");
    }

    // Generate batch name with timestamp if not provided
    const finalBatchName = batchName && batchName.trim() 
      ? batchName.trim() 
      : `${batchNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    const formData = {
      batchNumber: batchNumber,
      batchName: finalBatchName,
      apiaries: batchFormData.apiaries, // ✅ Include apiaries data
    };

    const response = await fetch('/api/create-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create batch');
    }

    setData({
      ...data,
      batches: [result.batch, ...data.batches],
      tokenStats: data.tokenStats,
    });

    setNotification({
      show: true,
      message: `Batch ${batchNumber} created successfully with ${batchFormData.apiaries.length} apiaries!`,
    });

    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);

    // ✅ Reset form data properly
    setBatchNumber('');
    setBatchName('');
   setBatchFormData(prev => ({
  ...prev,
  apiaries: [{ name: '', number: '', hiveCount: 0, kilosCollected: 0 }]
}));
setShowBatchModal(false);

    
  } catch (error) {
    console.error('Error creating batch:', error);
    setNotification({
      show: true,
      message: `Error: ${error.message}`,
    });

    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);
  } finally {
    setLoading(false);
  }
};
const [showAllBatches, setShowAllBatches] = useState(false);
const [expandedBatches, setExpandedBatches] = useState<string[]>([]);

// Function to toggle batch expansion
    const toggleBatchExpansion = (batchId: string) => {
      if (expandedBatches.includes(batchId)) {
        setExpandedBatches(expandedBatches.filter(id => id !== batchId));
      } else {
        setExpandedBatches([...expandedBatches, batchId]);
      }
    };
    
    interface BatchData {
  id?: string;
  batchNumber?: string;
  status?: string;
  completedChecks?: number;
  totalChecks?: number;
  certificationDate?: string | null;
  expiryDate?: string | null;
  weightKg?: number;
  jarsUsed?: number;
  originOnly?: number;
  qualityOnly?: number;
  bothCertifications?: number;
  uncertified?: number;
  containerType?: string;
  labelType?: string;
  [key: string]: any; // Allow for other properties
}

// Convert data.batches to an array if it isn't already
const batchesArray: BatchData[] = Array.isArray(data.batches) ? data.batches : [];


  const allBatches: ProcessedBatch[] = batchesArray.map((batch: BatchData) => ({
  id: batch.id || '',
  name: batch.batchNumber || '',
  status: batch.status || 'Pending',
  completedChecks: batch.completedChecks || 0,
  totalChecks: batch.totalChecks || 10, // Provide a default if missing
  certificationDate: batch.certificationDate || null,
  expiryDate: batch.expiryDate || null,
  totalKg: batch.weightKg || 0, // Make sure we use weightKg here
  jarsUsed: batch.jarsUsed || 0,
  originOnly: batch.originOnly || 0,
  qualityOnly: batch.qualityOnly || 0,
  bothCertifications: batch.bothCertifications || 0,
  uncertified: batch.uncertified || 0,
  containerType: batch.containerType,
  labelType: batch.labelType,
  // Initialize percentage properties
  originOnlyPercent: 0,
  qualityOnlyPercent: 0,
  bothCertificationsPercent: 0,
  uncertifiedPercent: 0
}));
   // Fix the percentage calculations to properly handle edge cases
allBatches.forEach(batch => {
  const total = batch.originOnly + batch.qualityOnly + batch.bothCertifications + batch.uncertified;
  
  // Handle zero total case to avoid NaN
  if (total === 0) {
    batch.originOnlyPercent = 0;
    batch.qualityOnlyPercent = 0;
    batch.bothCertificationsPercent = 0;
    batch.uncertifiedPercent = 100; // Default to 100% uncertified if no data
  } else {
    // Calculate percentages and round to ensure they add up to 100%
    batch.originOnlyPercent = Math.round((batch.originOnly / total) * 100);
    batch.qualityOnlyPercent = Math.round((batch.qualityOnly / total) * 100);
    batch.bothCertificationsPercent = Math.round((batch.bothCertifications / total) * 100);
    
    // Calculate uncertified as remainder to ensure percentages sum to 100
    batch.uncertifiedPercent = 100 - (
      batch.originOnlyPercent + 
      batch.qualityOnlyPercent + 
      batch.bothCertificationsPercent
    );
    
    // Handle edge case where rounding made total > 100
    if (batch.uncertifiedPercent < 0) batch.uncertifiedPercent = 0;
  }
});
    const [searchTerm, setSearchTerm] = useState('');
    // Filter batches based on search term
    const filteredBatches = allBatches.filter(batch => 
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Determine which batches to display
    const displayedBatches = showAllBatches ? filteredBatches : filteredBatches.slice(0, 3);

    
  interface BatchData {
  batchName: string;
  batchId: string;
  category: string;
  weight: number;
  jars: number;
  containerType: string;
  labelType: string;
  stockLevel: string;
  location: string;
  lastUpdated: string;
}
  // Calculate totals
  const totalWeight = data.containers.reduce((sum, container) => sum + container.weight, 0);
  const totalLabels = data.labels.reduce((sum, label) => sum + label.count, 0);
  const totalBatches = data.batches.length;

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState(null);
  const [selectedItem, setSelectedItem] = useState<BatchData | null>(null);
  const [timeRange, setTimeRange] = useState('Monthly');
  const router = useRouter();
  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tokensAdded = parseInt(urlParams.get('tokensAdded'));
  if (tokensAdded) {
    setTokenBalance(prev => prev + tokensAdded);
    // Clean up URL
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
useEffect(() => {
  const handleTokensUpdated = (event: Event) => {
    const customEvent = event as CustomEvent<{
      action: string;
      tokensAdded: number;
      newBalance: number;
    }>;

    const { action, tokensAdded, newBalance } = customEvent.detail;

    if (action === 'add') {
      setTokenBalance(newBalance);
    } else {
      setTokenBalance(prev => prev + tokensAdded);
    }
  };

  window.addEventListener('tokensUpdated', handleTokensUpdated);

  return () => {
    window.removeEventListener('tokensUpdated', handleTokensUpdated);
  };
}, []);
// In your main component's initialization
useEffect(() => {
  const savedBalance = parseInt(localStorage.getItem('tokenBalance') || '0');
  setTokenBalance(savedBalance);
}, []);


useEffect(() => {
  const initMap = () => {
    if (window.google && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 52.0907, lng: 5.1214 },
        zoom: 8,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      googleMapRef.current = map;

      // Add click listener to map with precise position tracking
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Get the exact pixel position of the click relative to the map container
        const mapRect = mapRef.current.getBoundingClientRect();
        const overlay = new window.google.maps.OverlayView();
        
        overlay.onAdd = function() {
          // Get the pixel position of the clicked lat/lng
          const projection = this.getProjection();
          const pixelPosition = projection.fromLatLngToContainerPixel(event.latLng);
          
          // Calculate absolute position on the page
          const clickX = mapRect.left + pixelPosition.x + window.scrollX;
          const clickY = mapRect.top + pixelPosition.y + window.scrollY;
          
          console.log('Map clicked at:', { lat, lng, x: clickX, y: clickY });
          setSelectedLocation({ lat, lng });
          setClickPosition({ x: clickX, y: clickY });
          setShowLocationConfirm(true);
          
          // Remove the overlay after getting the position
          overlay.setMap(null);
        };
        
        overlay.draw = function() {};
        overlay.setMap(map);
      });
    }
  };

  if (!window.google) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  } else {
    initMap();
  }
}, []);

// Add these handler functions
const handleLocationConfirm = async () => {
  if (!selectedLocation) return;
     
  try {
    const response = await fetch('/api/apiaries/locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        name: `Location ${new Date().toLocaleString()}`,
      }),
    });
         
    if (response.ok) {
      const newLocation = await response.json();
      setSavedApiaryLocations(prev => [...prev, newLocation]);
      
      // Show success notification
      setNotification({
        show: true,
        message: 'Apiary location saved successfully!'
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
             
      // Reset the modal state
      setShowLocationConfirm(false);
      setSelectedLocation(null);
    } else {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      
      // Show error notification
      setNotification({
        show: true,
        message: `Failed to save location: ${errorData.error || 'Unknown error'}`
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
    }
  } catch (error) {
    console.error('Error saving apiary location:', error);
    
    // Show error notification
    setNotification({
      show: true,
      message: 'Failed to save apiary location'
    });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);
  }
};

// Remove the unused saveApiaryLocation function
const handleLocationCancel = () => {
  setShowLocationConfirm(false);
  setSelectedLocation(null);
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
        <a href="/dashboard" className="flex items-center px-4 py-3 hover:bg-gray-700">
          <Home className="h-5 w-5 mr-3" />
          Dashboard
        </a>
      </li>
      <li>
        <a href="/batches"
         onClick={(e) => {
    e.preventDefault();
    // For a React app with routing, you could use:
    router.push('/batches');
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
        <a href="/profile" className="flex items-center px-4 py-3 hover:bg-gray-700">
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

{/* Backdrop overlay when sidebar is open - now with blur effect */}
{sidebarOpen && (
  <div 
    className="fixed inset-0 backdrop-blur-sm bg-black/20 z-10"
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
      <p className="text-lg font-bold">{tokenBalance}</p>
    </div>
    <button
      onClick={() => router.push('/buy-token')}
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
            <button
               onClick={() => {
               // Clear user session/token here
               localStorage.removeItem('token');  // or your auth token key
               // Redirect to login or homepage
               router.push('/login');
  }}
  className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-3"
>
  <Package className="w-4 h-4 mr-2" />
  Logout
</button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Last updated: {lastUpdated}
        </p>
      </header>

      {/* Create Batch Modal */}
{showBatchModal && (
  <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-30">
    <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto mx-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Create New Batch</h3>
        <button
          onClick={() => {
            setShowBatchModal(false);
            setBatchNumber('');
            setBatchName('');
            setBatchFormData({ apiaries: [{ name: '', number: '', hiveCount: 0, kilosCollected: 0, locationId: '' }] });
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Batch Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Number <span className="text-red-500">*</span>
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

        {/* Batch Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Batch Name (Optional)
          </label>
          <input
            type="text"
            name="batchName"
            value={batchName || ''}
            onChange={(e) => setBatchName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter batch name (optional)"
          />
          <p className="text-xs text-gray-500 mt-1">
            If left empty, will default to "{batchNumber ? `${batchNumber}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}` : 'BatchNumber_YYYY-MM-DDTHH-MM-SS'}"
          </p>
        </div>
      </div>

      {/* Associated Apiaries Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-lg">Associated Apiaries</h4>
          <button
            type="button"
            onClick={addApiary}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-200 hover:bg-blue-50"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Apiary
          </button>
        </div>

        {/* No Apiaries State */}
        {batchFormData.apiaries.length === 0 && (
          <div 
            className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 mb-4"
            onClick={addApiary}
          >
            <PlusCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 font-medium">Click to add your first apiary</p>
            <p className="text-xs text-gray-400 mt-1">You'll need at least one apiary to create a batch</p>
          </div>
        )}

        {/* Saved Locations Info */}
        {savedApiaryLocations.length === 0 && batchFormData.apiaries.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                No saved locations available. Click on the map to save apiary locations first.
              </p>
            </div>
          </div>
        )}

        {/* Apiaries List */}
        {batchFormData.apiaries.map((apiary, index) => (
          <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-gray-800">Apiary #{index + 1}</h5>
              {batchFormData.apiaries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeApiary(index)}
                  className="text-red-500 hover:text-red-700 text-sm flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apiary Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={apiary.name}
                  onChange={(e) => handleApiaryChange(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter apiary name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apiary Number/ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={apiary.number}
                  onChange={(e) => handleApiaryChange(index, 'number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter apiary ID"
                  required
                />
              </div>
              
              {/* Location Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apiary Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={apiary.locationId || ''}
                  onChange={(e) => handleApiaryChange(index, 'locationId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                >
                  <option value="">Select a saved location</option>
                  {savedApiaryLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                    </option>
                  ))}
                </select>
                {savedApiaryLocations.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    No saved locations. Click on the map to save apiary locations first.
                  </p>
                )}
                {apiary.locationId && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Location selected successfully
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Hives <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={apiary.hiveCount}
                  onChange={(e) => handleApiaryChange(index, 'hiveCount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Honey Collected (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={apiary.kilosCollected}
                  onChange={(e) => handleApiaryChange(index, 'kilosCollected', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="0.0"
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      {batchFormData.apiaries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-blue-900 mb-2">Batch Summary</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700 font-medium">Total Apiaries</p>
              <p className="text-blue-900 text-lg font-bold">{batchFormData.apiaries.length}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Total Hives</p>
              <p className="text-blue-900 text-lg font-bold">
                {batchFormData.apiaries.reduce((sum, apiary) => sum + (parseInt(apiary.hiveCount) || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Total Honey (kg)</p>
              <p className="text-blue-900 text-lg font-bold">
                {batchFormData.apiaries.reduce((sum, apiary) => sum + (parseFloat(apiary.kilosCollected) || 0), 0).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Locations Set</p>
              <p className="text-blue-900 text-lg font-bold">
                {batchFormData.apiaries.filter(apiary => apiary.locationId).length}/{batchFormData.apiaries.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={() => {
            setShowBatchModal(false);
            setBatchNumber('');
            setBatchName('');
            setBatchFormData({ apiaries: [{ name: '', number: '', hiveCount: 0, kilosCollected: 0, locationId: '' }] });
          }}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={createBatch}
          disabled={!batchNumber || batchFormData.apiaries.length === 0 || batchFormData.apiaries.some(apiary => !apiary.name || !apiary.number || !apiary.locationId)}
          className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
            batchNumber && batchFormData.apiaries.length > 0 && batchFormData.apiaries.every(apiary => apiary.name && apiary.number && apiary.locationId)
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Create Batch
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
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Token Wallet Section - Adjusted for equal height */}
  <div className="bg-white p-4 rounded-lg shadow text-black h-fit">
    <h2 className="text-lg font-semibold mb-4">Token Wallet Overview</h2>
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="text-md font-semibold mb-3">Token Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-white rounded-lg shadow">
            <div className="flex items-center mb-1">
              <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
              <p className="text-sm font-medium">Origin certified</p>
            </div>
            <p className="text-xl font-bold">{data.tokenStats.originOnly} tokens</p>
            <p className="text-xs text-gray-500">Applied to {data.tokenStats.originOnly} kg of honey</p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow">
            <div className="flex items-center mb-1">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <p className="text-sm font-medium">Quality certified</p>
            </div>
            <p className="text-xl font-bold">{data.tokenStats.qualityOnly} tokens</p>
            <p className="text-xs text-gray-500">Applied to {data.tokenStats.qualityOnly} kg of honey</p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow">
            <div className="flex items-center mb-1">
              <div className="h-3 w-3 rounded-full bg-gray-400 mr-2"></div>
              <p className="text-sm font-medium">Remaining Tokens</p>
            </div>
            <p className="text-xl font-bold">{data.tokenStats.remainingTokens} tokens</p>
            <p className="text-xs text-gray-500">Available for use</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={250}>
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

  {/* Google Maps Section - Same height */}
  <div className="bg-white p-4 rounded-lg shadow text-black h-fit">
    <h2 className="text-lg font-semibold mb-4">Apiary Locations</h2>
    <p className="text-sm text-gray-600 mb-3">Click on the map to create a batch for that location</p>
    <div 
      ref={mapRef} 
      className="w-full rounded-lg border border-gray-300 cursor-pointer"
      style={{ height: '450px' }}
    />
  </div>
</div>

{/* Location Confirmation Modal */}
{showLocationConfirm && selectedLocation && (
  <>
    {/* Invisible backdrop for click-outside-to-close */}
    <div 
      className="fixed inset-0 z-40"
      onClick={handleLocationCancel}
    />
    
    {/* Comic bubble popup positioned exactly at click location */}
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${clickPosition.x}px`,
        top: `${clickPosition.y}px`,
        transform: 'translate(-50%, -100%)', // Center horizontally, position above click point
      }}
    >
      <div className="relative pointer-events-auto">
        {/* Comic bubble with tail pointing down to click location */}
        <div className="bg-white rounded-2xl p-4 shadow-2xl border-4 border-blue-400 max-w-xs relative transform hover:scale-105 transition-transform duration-200 mb-2">
          
          {/* Bubble content */}
          <div className="text-center">
            <div className="text-2xl mb-2">📍</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Save Apiary Location?</h3>
            <p className="text-sm text-gray-600 mb-1">
              Lat: {selectedLocation.lat.toFixed(4)}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Lng: {selectedLocation.lng.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Save this location for future batch creation?
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={handleLocationCancel}
                className="flex-1 px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
  onClick={handleLocationConfirm}
  disabled={isSaving}
  className="flex-1 px-3 py-2 text-xs bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors font-semibold flex items-center justify-center disabled:opacity-50"
>
  <MapPin className="w-3 h-3 mr-1" />
  {isSaving ? 'Saving...' : 'Save!'}
</button>
            </div>
          </div>
        </div>
        
        {/* Bubble tail pointing down to exact click location */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-1">
          {/* Outer tail (border color) */}
          <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[20px] border-l-transparent border-r-transparent border-t-blue-400" />
          {/* Inner tail (background color) */}
          <div className="absolute w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-white top-0 left-1/2 transform -translate-x-1/2" />
        </div>
      </div>
    </div>
  </>
)}
     
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
              <p className="font-medium">{selectedItem.containerType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Label Type</p>
              <p className="font-medium">{selectedItem.labelType}</p>
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
                    <h3 className="text-md font-semibold">Total Kilograms: {batch.totalKg || 0}</h3>
                    <p className="text-xs text-gray-500">Jars used: {batch.jarsUsed || 0}</p>
                  </div>
                  <div className="h-48 flex items-center justify-center">
                    {/* SVG circle chart with arrow indicators */}
                    <div className="relative w-40 h-40">
                      {/* Calculate percentages from actual data or default to 0 */}
                      {(() => {
                        // Calculate actual percentages from batch data (removed bothCertifications)
                        const originOnly = batch.originOnly || 0;
                        const qualityOnly = batch.qualityOnly || 0;
                        const uncertified = batch.uncertified || 0;
                        const total = originOnly + qualityOnly + uncertified;
                        
                        // Calculate percentages (handle division by zero)
                        const originOnlyPercent = total > 0 ? Math.round((originOnly / total) * 100) : 0;
                        const qualityOnlyPercent = total > 0 ? Math.round((qualityOnly / total) * 100) : 0;
                        const uncertifiedPercent = total > 0 ? Math.round((uncertified / total) * 100) : 0;
                        
                        return (
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
                            
                            {/* Only render segments if there's data to show */}
                            {total > 0 && (
                              <>
                                {/* Origin Only - Blue segment */}
                                {originOnlyPercent > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#3b82f6" 
                                    strokeWidth="16"
                                    strokeDasharray={`${originOnlyPercent * 2.51} 251`}
                                    strokeLinecap="butt"
                                  />
                                )}
                                
                                {/* Quality Only - Green segment */}
                                {qualityOnlyPercent > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#10b981"
                                    strokeWidth="16"
                                    strokeDasharray={`${qualityOnlyPercent * 2.51} 251`}
                                    strokeDashoffset={`${-originOnlyPercent * 2.51}`}
                                    strokeLinecap="butt"
                                  />
                                )}
                                
                                {/* Uncertified - Gray segment */}
                                {uncertifiedPercent > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#9ca3af"
                                    strokeWidth="16"
                                    strokeDasharray={`${uncertifiedPercent * 2.51} 251`}
                                    strokeDashoffset={`${-(originOnlyPercent + qualityOnlyPercent) * 2.51}`}
                                    strokeLinecap="butt"
                                  />
                                )}
                              </>
                            )}
                          </svg>
                        );
                      })()}
                      
                      {/* Center text display */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium">{batch.totalKg || 0} kg</span>
                        <span className="text-xs text-gray-500">{batch.jarsUsed || 0} jars</span>
                      </div>
                      
                      {/* Calculate percentages for arrow indicators */}
                      {(() => {
                        const originOnly = batch.originOnly || 0;
                        const qualityOnly = batch.qualityOnly || 0;
                        const uncertified = batch.uncertified || 0;
                        const total = originOnly + qualityOnly + uncertified;
                        
                        const originOnlyPercent = total > 0 ? Math.round((originOnly / total) * 100) : 0;
                        const qualityOnlyPercent = total > 0 ? Math.round((qualityOnly / total) * 100) : 0;
                        const uncertifiedPercent = total > 0 ? Math.round((uncertified / total) * 100) : 0;
                        
                        return (
                          <>
                            {/* Only show arrows if there's data */}
                            {originOnlyPercent > 0 && (
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                                <span>↓</span>
                                <span className="ml-1">{originOnlyPercent}%</span>
                              </div>
                            )}
                            
                            {qualityOnlyPercent > 0 && (
                              <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                                <span>←</span>
                                <span className="ml-1">{qualityOnlyPercent}%</span>
                              </div>
                            )}
                            
                            {uncertifiedPercent > 0 && (
                              <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                                <span>→</span>
                                <span className="ml-1">{uncertifiedPercent}%</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Certification stats */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-md font-semibold mb-3">Certification Progress</h3>
                  <div className="flex flex-wrap justify-between mb-4">
                    {(() => {
                      // Calculate jar counts from actual data (removed bothCertifications)
                      const originOnly = batch.originOnly || 0;
                      const qualityOnly = batch.qualityOnly || 0;
                      const uncertified = batch.uncertified || 0;
                      const total = originOnly + qualityOnly + uncertified;
                      
                      // Calculate percentages
                      const originOnlyPercent = total > 0 ? Math.round((originOnly / total) * 100) : 0;
                      const qualityOnlyPercent = total > 0 ? Math.round((qualityOnly / total) * 100) : 0;
                      const uncertifiedPercent = total > 0 ? Math.round((uncertified / total) * 100) : 0;
                      
                      // Calculate jar counts
                      const totalJars = batch.jarsUsed || 0;
                      const originOnlyJars = total > 0 ? Math.round(originOnly * totalJars / total) : 0;
                      const qualityOnlyJars = total > 0 ? Math.round(qualityOnly * totalJars / total) : 0;
                      const uncertifiedJars = total > 0 ? Math.round(uncertified * totalJars / total) : 0;
                      
                      const certificationData = [
                        {
                          color: "bg-blue-500",
                          label: "Origin Certified",
                          value: originOnly,
                          percent: originOnlyPercent,
                          jars: originOnlyJars
                        },
                        {
                          color: "bg-green-500",
                          label: "Quality Certified",
                          value: qualityOnly,
                          percent: qualityOnlyPercent,
                          jars: qualityOnlyJars
                        },
                        {
                          color: "bg-gray-400",
                          label: "Uncertified",
                          value: uncertified,
                          percent: uncertifiedPercent,
                          jars: uncertifiedJars
                        },
                      ];
                      
                      return certificationData.map((item, index) => (
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
                              containerType: batch.containerType,
                              labelType: batch.labelType,
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
                          <p className="text-xs text-gray-500">
                            {item.jars} jars {item.percent > 0 ? `· ${item.percent}% of batch` : ''}
                          </p>
                        </div>
                      ));
                    })()}
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
  };



