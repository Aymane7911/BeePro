'use client'

import React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, X, Search, ChevronDown, ChevronUp, Printer, PlusCircle, Check, AlertCircle, MapPin, Package, RefreshCw, Filter, Sparkles, Upload, Trash2, AlertTriangle, CheckCircle, Wallet, Plus, Home, Layers, Activity, Users, Settings, HelpCircle, FileText, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRouter } from 'next/navigation';


interface Apiary {
  batchId: string,
  batchNumber: string,
  name: string;
  number: string;
  hiveCount: number;
  latitude: number;
  longitude: number;
  honeyCollected: number;
}
interface FormApiary extends Apiary {
  batchId: string;
  batchNumber: string;
}

interface CertificationStatus {
  originOnly: number;
  qualityOnly: number;
  bothCertifications: number;
  uncertified: number;
}

interface Batch {
  id: string;
  batchNumber: string;
  name: string;
  createdAt: string;
  status: 'pending' | 'completed';
  totalKg: number;
  jarsProduced: number;
  apiaries: Apiary[];
  certificationStatus: CertificationStatus;
}

interface TokenStats {
  totalTokens: number;
  remainingTokens: number;
  originOnly: number;
  qualityOnly: number;
  bothCertifications: number;
}
declare global {
  interface Window {
    [key: `apiariesMap_${number}`]: google.maps.Map;
    [key: `apiariesMarker_${number}`]: google.maps.Marker;
  }
}
type MapRef = {
  map: google.maps.Map;
  marker: google.maps.Marker;
};
interface CustomJar {
  id: number;
  size: number;
  quantity: number;
  apiaryIndex?: number;
}

interface JarCertification {
  origin?: boolean;
  quality?: boolean;
  both?: boolean;
  selectedType?: 'origin' | 'quality' | 'both';
}

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface ApiaryLocation extends LocationCoordinates {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

interface JarCertifications {
  [key: number]: JarCertification;
}

interface SelectedApiary extends Apiary {
  kilosCollected: number; // Override to ensure this is always present
}

interface LocationCoordinates {
  latitude: number;  // Changed from lat to latitude
  longitude: number; // Changed from lng to longitude
}

interface ApiaryLocation extends LocationCoordinates {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

interface ApiaryFormData {
  name: string;
  number: string;
  hiveCount: number;
  honeyCollected: number;
  location: ApiaryLocation | null;
}



export default function BatchesPage() {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPrintNotification, setShowPrintNotification] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastUpdated, setLastUpdated] = useState('--');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showProfileNotification, setShowProfileNotification] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [apiaryHoneyValues, setApiaryHoneyValues] = useState<Record<string, number>>({});
  const [showProfileCompletedMessage, setShowProfileCompletedMessage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ production: 0, lab: 0 });
  const [loading, setLoading] = useState(false);
  const [savedApiaryLocations, setSavedApiaryLocations] = useState<ApiaryLocation[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<HTMLDivElement | null>(null); 
   const googleMapRef = useRef<google.maps.Map | null>(null);
  const miniGoogleMapRef = useRef<google.maps.Map | null>(null);
  const apiaryMarkers = useRef<google.maps.Marker[]>([]);
  const tempMarker = useRef<google.maps.Marker | null>(null);
  
  const [showBatchModal, setShowBatchModal] = useState(false);
const [selectedApiaries, setSelectedApiaries] = useState<SelectedApiary[]>([]); // Selected apiaries for current batch
const [isLoadingApiaries, setIsLoadingApiaries] = useState(false);
 const [availableApiaries, setAvailableApiaries] = useState<Apiary[]>([]); // List of all created apiaries
const [selectedApiary, setSelectedApiary] = useState<Apiary | null>(null);
const [isOpen, setIsOpen] = useState(false);
const [batchNumber, setBatchNumber] = useState('');
const [batchName, setBatchName] = useState(''); // Added batch name field
const [selectedDropdownApiary, setSelectedDropdownApiary] = useState('');
const [showApiaryModal, setShowApiaryModal] = useState(false);
const [apiaryFormData, setApiaryFormData] = useState<ApiaryFormData>({
  name: '',
  number: '',
  hiveCount: 0,
  honeyCollected: 0,
  location: null
});



  
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const mapRefs = useRef<MapRef[]>([]);
  const mapsLoaded = useRef(false);
  const googleMapsApiKey = "AIzaSyBhRpOpnKWIXGMOTsdVoGKAnAC94Q0Sgxc"; 
  type SortableBatchKey = 'batchNumber' | 'name' | 'status' | 'totalKg';
const [certificationAmounts, setCertificationAmounts] = useState({
  origin: 0,
  quality: 0,
  both: 0
});
const [jarSizeDistribution, setJarSizeDistribution] = useState({
  jar250g: 0,
  jar400g: 0,
  jar600g: 0
});
const isFormValid = () => {
  // Check if we have jars defined
  const totalJars = getTotalJarsAcrossApiaries();
  if (totalJars === 0) return false;
  
  // Check if all jar types have certifications selected
  const allJarsHaveCertifications = Object.values(apiaryJars).flat().every(jar => 
    jarCertifications[jar.id]?.selectedType
  );
  if (!allJarsHaveCertifications) return false;
  
  // Check token balance
  if (tokenCalculation.remaining < 0) return false;
  
  // Check required documents
  if (needsProductionReport() && !formData.productionReport) return false;
  if (needsLabReport() && !formData.labReport) return false;
  
  // Check if all apiaries have valid coordinates
  const allApiariesHaveLocation = formData.apiaries.every(apiary => 
    apiary.latitude && apiary.longitude
  );
  if (!allApiariesHaveLocation) return false;
  
  return true;
};

const createBatch = async () => {
  // Improved validation with proper array checking
  if (!batchNumber?.trim() || !Array.isArray(selectedApiaries) || selectedApiaries.length === 0) {
    setNotification({
      show: true,
      message: 'Please fill in batch number and select at least one apiary',
    });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    return;
  }

  // Check if any selected apiary doesn't have honey collection amount set
  if (selectedApiaries.some(apiary => !apiary.kilosCollected || apiary.kilosCollected <= 0)) {
    setNotification({
      show: true,
      message: 'Please set honey collection amount for all selected apiaries',
    });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    return;
  }

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

    // Transform selected apiaries to match the expected format
    const apiariesForBatch = selectedApiaries.map(apiary => ({
      id: apiary.id,
      name: apiary.name,
      number: apiary.number,
      hiveCount: apiary.hiveCount || 0,
      kilosCollected: apiary.kilosCollected ?? 0,
      locationId: apiary.location?.id || null,
      location: apiary.location || null
    }));

    const formData = {
      batchNumber: batchNumber.trim(),
      batchName: finalBatchName,
      apiaries: apiariesForBatch,
      totalHives: selectedApiaries.reduce((sum, apiary) => sum + (apiary.hiveCount || 0), 0),
      totalHoney: selectedApiaries.reduce(
  (sum, apiary) => sum + (apiary.kilosCollected ?? 0),
  0
),

    };

    console.log('Creating batch with data:', formData); // Debug log

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

    // Update data state with new batch (ensure data exists)
    if (data && data.batches) {
      setData({
        ...data,
        batches: [result.batch, ...data.batches],
        tokenStats: data.tokenStats,
      });
    }

    setNotification({
      show: true,
      message: `Batch ${batchNumber} created successfully with ${selectedApiaries.length} apiaries!`,
    });

    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);

    // Reset form data and close modal
    setBatchNumber('');
    setBatchName('');
    setSelectedApiaries([]);
    setSelectedDropdownApiary(''); // Reset dropdown state
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


const isAllHoneyAllocated = () => {
  const totalHoneyAvailable = getTotalHoneyFromApiaries();
  const totalHoneyInJars = Object.values(apiaryJars).flat().reduce((sum, jar) => 
    sum + (jar.size * jar.quantity / 1000), 0
  );
  return Math.abs(totalHoneyAvailable - totalHoneyInJars) < 0.001; // Allow for small floating point differences
};

// 2. Add helper function to check remaining honey for specific apiary
const getRemainingHoneyForApiary = (apiaryIndex: number) => {
  const apiary = formData.apiaries[apiaryIndex];
  const jarsForApiary = getJarsForApiary(apiaryIndex);
  const allocatedHoney = jarsForApiary.reduce((sum, jar) => sum + (jar.size * jar.quantity / 1000), 0);
  return apiary.kilosCollected - allocatedHoney;
};

const isApiaryFullyAllocated = (apiaryIndex: number) => {
  return Math.abs(getRemainingHoneyForApiary(apiaryIndex)) < 0.001;
};


const calculateTotalHoneyToCertify = (amounts) => {
  const { origin, quality, both } = amounts;
  // The total honey to certify is the sum of all amounts
  // Note: 'both' means honey that gets both certifications, but it's still the same physical honey
  return origin + quality + both;
};

// Add this helper function to calculate maximum jars possible for each size
const calculateMaxJarsForSize = (totalHoneyToCertify, jarSize) => {
  return Math.floor(totalHoneyToCertify / jarSize);
};
  const calculateTokensNeeded = (amounts, jarSizes) => {
  const { origin, quality, both } = amounts;
  const { jar250g, jar400g, jar600g } = jarSizes;
  // Calculate total honey that will be certified
  const totalHoneyToCertify = calculateTotalHoneyToCertify(amounts);
  
  // Calculate total weight to be certified
  const totalWeight = origin + quality + both;
  
  // Calculate jars for each size (1 token per jar regardless of size)
  const totalJars = jar250g + jar400g + jar600g;
  
  
  // Check if jar sizes match the certification amounts
  const totalJarWeight = (jar250g * 0.25) + (jar400g * 0.4) + (jar600g * 0.6);

  // Calculate maximum possible jars for each size
  const maxJar250g = Math.floor(totalHoneyToCertify / 0.25);
  const maxJar400g = Math.floor(totalHoneyToCertify / 0.4);
  const maxJar600g = Math.floor(totalHoneyToCertify / 0.6);
  
  // Check if jar quantities exceed maximum possible
  const jar250gExceeded = jar250g > maxJar250g;
  const jar400gExceeded = jar400g > maxJar400g;
  const jar600gExceeded = jar600g > maxJar600g;

  return {
    tokensNeeded: totalJars,
    totalHoneyToCertify: totalHoneyToCertify,
    totalJarWeight: totalJarWeight,
    isValid: Math.abs(totalJarWeight - totalHoneyToCertify) < 0.01, // Allow small floating point differences
    maxJar250g,
    maxJar400g,
    maxJar600g,
    jar250gExceeded,
    jar400gExceeded,
    jar600gExceeded,
    hasExceededJars: jar250gExceeded || jar400gExceeded || jar600gExceeded
  };
};
  const [tokenBalance, setTokenBalance] = useState<number>(0);




  const [sortBy, setSortBy] = useState<SortableBatchKey>('batchNumber');
  

  const [profileData, setProfileData] = useState({
    passportId: '',
    passportScan: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tokenStats, setTokenStats] = useState({
    totalTokens: 0,
    remainingTokens: 0,
    originOnly: 0,
    qualityOnly: 0,
    bothCertifications: 0
  });
  // Fixed initial state - use null instead of 0 for coordinates
const [formData, setFormData] = useState({
  certificationType: '',
  productionReport: null as File | null,
  labReport: null as File | null,
  apiaries: [{
    batchId: '',
    batchNumber: '',
    name: '',
    number: '',
    hiveCount: 0,
    latitude: null as number | null,  // Changed from 0 to null
    longitude: null as number | null, // Changed from 0 to null
    kilosCollected: 0,
  }]
});
const [mapsLinkInput, setMapsLinkInput] = useState('');
{/* Add this function to handle maps link processing */}
const handleMapsLinkSubmit = async () => {
  if (!mapsLinkInput.trim()) {
    alert('Please enter a Google Maps link or coordinates');
    return;
  }

  try {
    const coordinates = await extractCoordinatesFromMapsLink(mapsLinkInput);
    
    if (coordinates === 'SHORTENED_URL') {
      // Handle shortened URLs with special instructions
      const userChoice = confirm(
        'This appears to be a shortened Google Maps link. Due to browser security restrictions, we cannot automatically extract coordinates from shortened links.\n\n' +
        'Would you like to:\n\n' +
        '• Click "OK" to open the link in a new tab so you can copy the full URL\n' +
        '• Click "Cancel" to manually enter coordinates instead\n\n' +
        'Instructions:\n' +
        '1. The link will open in a new tab\n' +
        '2. Copy the full URL from the address bar\n' +
        '3. Come back and paste that URL here\n' +
        '4. Or copy the coordinates and paste them as "latitude, longitude"'
      );
      
      if (userChoice) {
        // Open the shortened URL in a new tab
        window.open(mapsLinkInput, '_blank');
        alert('The link has been opened in a new tab. Please copy the full URL from the address bar and paste it here, or copy the coordinates and enter them as "latitude, longitude".');
      } else {
        alert('You can also enter coordinates directly in the format: "25.2048, 55.2708" (latitude, longitude)');
      }
      return;
    }
    
    if (coordinates) {
      const newLocation = {
        id: Date.now(),
        name: `Location from ${mapsLinkInput.includes('http') ? 'Maps Link' : 'Coordinates'}`,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        lat: coordinates.lat,
        lng: coordinates.lng,
        createdAt: new Date().toISOString()
      };

      setApiaryFormData(prev => ({
        ...prev,
        location: newLocation
      }));

      // Center the map on the new location
      if (miniGoogleMapRef.current) {
        const newCenter = new google.maps.LatLng(coordinates.lat, coordinates.lng);
        miniGoogleMapRef.current.setCenter(newCenter);
        miniGoogleMapRef.current.setZoom(15);
      }

      // Clear the input
      setMapsLinkInput('');
      
      alert(`Location set successfully! Coordinates: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
    } else {
      alert(
        'Could not extract coordinates. Please try:\n\n' +
        '📍 DIRECT COORDINATES:\n' +
        '   • Format: "25.2048, 55.2708"\n' +
        '   • Format: "25.2048 55.2708"\n\n' +
        '🔗 GOOGLE MAPS LINKS:\n' +
        '   • Full URL from browser address bar\n' +
        '   • Right-click on location → "What\'s here?" → copy coordinates\n\n' +
        '📱 FROM MOBILE APP:\n' +
        '   • Share → Copy Link (then open link in browser and copy full URL)\n' +
        '   • Long press on location → copy coordinates'
      );
    }
  } catch (error) {
    console.error('Error processing maps link:', error);
    alert('An error occurred while processing the input. Please try entering coordinates directly in the format: "latitude, longitude"');
  }
};
  
 



// Add this useEffect after where you define the showCompleteForm state
useEffect(() => {
  if (showCompleteForm && selectedBatches.length > 0) {
    // Handle both single and multiple batch selections
    const allApiaries = selectedBatches.flatMap(batchId => {
      const selectedBatch = batches.find(b => b.id === batchId);
      
      if (selectedBatch && selectedBatch.apiaries && selectedBatch.apiaries.length > 0) {
        return selectedBatch.apiaries.map(apiary => ({
          batchId: apiary.batchId,
          batchNumber: apiary.batchNumber,
          name: apiary.name,
          number: apiary.number,
          hiveCount: apiary.hiveCount,
          kilosCollected: apiary.kilosCollected || 0,
          latitude: apiary.latitude || 0,    // Ensure it's never null/undefined
          longitude: apiary.longitude || 0   // Ensure it's never null/undefined
        }));
      }
      return [];
    });
    
    if (allApiaries.length > 0) {
      setFormData(prevState => ({
        ...prevState,
        apiaries: allApiaries
      }));
    }
  }
}, [showCompleteForm, selectedBatches, batches]);
  


  // Fetch batches from API
useEffect(() => {
  const token = localStorage.getItem('authtoken') || 
                localStorage.getItem('auth_token') || 
                localStorage.getItem('token') ||
                sessionStorage.getItem('authtoken') ||
                sessionStorage.getItem('auth_token') ||
                sessionStorage.getItem('token');
  
  console.log('[BatchesPage] Token from storage:', token ? 'Found token' : 'No token found');

  if (!token) {
    console.warn('[BatchesPage] No auth token found. User probably needs to login.');
    setIsLoading(false);
    setError('No authentication token found. Please log in.');
    // For demo/testing purposes, you can set a mock token
    // localStorage.setItem('authtoken', 'mock_token_for_testing');
    return;
  }
  const fetchBatches = async () => {
    try {
      setIsLoading(true);

      // Make sure we're using the correct API endpoint
      const response = await fetch('/api/batches', {  // Changed from '/api/create-batch' to '/api/batches'
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('[BatchesPage] Fetch response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BatchesPage] Fetch failed:', errorText);
        throw new Error(`Failed to fetch batches (${response.status}): ${errorText || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('[BatchesPage] Fetched batches data:', data);

      // Set the batches data properly
      setBatches(Array.isArray(data.batches) ? data.batches : []);
      
      // If token stats are available, update them too
      if (data.tokenStats) {
        setTokenStats(data.tokenStats);
      }

      setIsLoading(false);
      
      // Update last updated timestamp
      const now = new Date();
      setLastUpdated(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
    } catch (err) {
      console.error('[BatchesPage] Error fetching batches:', err);
      setError(err.message || 'Unknown error');
      setIsLoading(false);
    }
  };

  fetchBatches();
}, []);




  




useEffect(() => {
  if (selectedBatches.length > 0 && showCompleteForm) {
    // Collect all apiaries from selected batches
    const selectedBatchObjects = batches.filter(batch => selectedBatches.includes(batch.id));
    const existingApiaries : FormApiary[] = [];
    
    // Get existing apiaries from the selected batches
    selectedBatchObjects.forEach(batch => {
      if (batch.apiaries && batch.apiaries.length > 0) {
        batch.apiaries.forEach(apiary => {
          existingApiaries.push({
            ...apiary,
            batchId: batch.id,
            batchNumber: batch.batchNumber
          });
        });
      }
    });
    
    // If no existing apiaries, initialize with empty form
    if (existingApiaries.length === 0) {
  setFormData({
    certificationType: '',
    productionReport: null as File | null,
    labReport: null as File | null,
    apiaries: [{
      batchId: '',
      batchNumber: '',
      name: '',
      number: '',
      hiveCount: 0,
      kilosCollected: 0,
      latitude: null,  // Changed from 0 to null
      longitude: null  // Changed from 0 to null
    }]
  });
} else {
      // Use existing apiaries
      setFormData({
        certificationType: '',
        productionReport: null as File | null,
        labReport: null as File | null,
        apiaries: existingApiaries
      });
    }
  }
}, [selectedBatches, showCompleteForm, batches]);
  
  // Handle profile form changes

  const handleProfileChange = ( 
  field: 'batchNumber' | 'name' | 'number' | 'hiveCount' | 'latitude' | 'longitude' | 'kilosCollected', 
  value: string | number
) => {
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
  

  // 3. Function to fetch saved apiary locations
  const fetchSavedApiaryLocations = async () => {
    try {
      // Get auth token
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth-token') ||
                 localStorage.getItem('token') ||
                 sessionStorage.getItem('auth-token');
      }
  
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
  
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      console.log('Fetching saved locations with auth...');
      const response = await fetch('/api/apiaries/locations', {
        headers,
        credentials: 'include',
      });
  
      if (response.ok) {
        const locations = await response.json();
        console.log('Fetched saved locations:', locations);
        setSavedApiaryLocations(locations);
      } else {
        console.error('Failed to fetch saved locations:', response.status);
      }
    } catch (error) {
      console.error('Error fetching apiary locations:', error);
    }
  };
  
  // 4. Call fetchSavedApiaryLocations on component mount
  useEffect(() => {
    fetchSavedApiaryLocations();
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  //toggle expand
  const toggleExpand = (batchId: string) => {
  if (expandedBatch === batchId) {
    setExpandedBatch(null);
  } else {
    setExpandedBatch(batchId);
  }
};
  // Toggle batch selection
  const toggleBatchSelection = (batchId: string) => {
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
      batchId => batches.find(batch => batch.id === batchId)?.status === 'pending'
    );
    
    if (anyPending) {
      setShowPrintNotification(true);
    } else {
      // Mock printing functionality
      setShowCompleteForm(true);
    }
  };

  // Handle batch completion
 const handleCompleteBatch = async (e) => {
  e.preventDefault();
  const tokensUsed = tokenCalculation.tokensNeeded;

  // Check if all jars have certification types selected
  const allJarsHaveCertifications = Object.values(apiaryJars).flat().every(jar => 
    jarCertifications[jar.id]?.selectedType
  );
  
  if (!allJarsHaveCertifications) {
    alert('Please select a certification type for all jar types');
    return;
  }
  
  // Check required documents based on selected certifications
  const needsProductionReport = Object.values(jarCertifications).some(cert => 
    cert?.selectedType === 'origin' || cert?.selectedType === 'both'
  );
  
  const needsLabReport = Object.values(jarCertifications).some(cert => 
    cert?.selectedType === 'quality' || cert?.selectedType === 'both'
  );
  
  if (needsProductionReport && !formData.productionReport) {
    alert('Please upload a production report for origin/both certifications');
    return;
  }
  
  if (needsLabReport && !formData.labReport) {
    alert('Please upload a lab report for quality/both certifications');
    return;
  }

  // Validate that all apiaries have coordinates
  const incompleteApiaries = formData.apiaries.filter(apiary => !apiary.latitude || !apiary.longitude);
  if (incompleteApiaries.length > 0) {
    alert('Please set coordinates for all apiaries before completing the batch');
    return;
  }

  try {
    setIsLoading(true);

    // Get token with fallbacks
    const token = localStorage.getItem('authtoken') ||
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('authtoken') ||
                  sessionStorage.getItem('auth_token') ||
                  sessionStorage.getItem('token');
        
    if (!token) {
      throw new Error('No auth token found');
    }

    // STEP 4: UPDATE TOKEN BALANCE IMMEDIATELY WHEN "PAY TOKEN" IS CLICKED
    // Update localStorage first
    const currentBalance = parseInt(localStorage.getItem('tokenBalance') || '0');
    const newBalance = currentBalance - tokensUsed;
    localStorage.setItem('tokenBalance', newBalance.toString());

    // Update state immediately
    setTokenBalance(newBalance);

    // Dispatch custom event to update token balance across the app
    window.dispatchEvent(new CustomEvent('tokensUpdated', {
      detail: { 
        action: 'deduct',
        tokensDeducted: tokensUsed,
        newBalance: newBalance,
        batchIds: selectedBatches,
        jarCount: tokensUsed
      }
    }));

    // Process each batch individually
    for (const batchId of selectedBatches) {
      const batchData = {
        batchId,
        updatedFields: {
          status: 'Completed',
          jarCertifications: jarCertifications, // This will now work with the updated schema
          certificationDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completedChecks: 4,
          totalChecks: 4
        },
        apiaries: formData.apiaries
          .filter(apiary => apiary.batchId === batchId || !apiary.batchId)
          .map(apiary => {
            const storedValue = apiaryHoneyValues[`${batchId}-${apiary.number}`];
            return {
              name: apiary.name,
              number: apiary.number,
              hiveCount: apiary.hiveCount,
              latitude: apiary.latitude !== 0 ? apiary.latitude : null,
              longitude: apiary.longitude !== 0 ? apiary.longitude : null,
              kilosCollected: storedValue !== undefined ? storedValue : apiary.kilosCollected
            };
          })
      };

      const batchFormData = new FormData();
      batchFormData.append('data', JSON.stringify(batchData));
      
      if (formData.productionReport) {
        batchFormData.append('productionReport', formData.productionReport);
      }
      
      if (formData.labReport) {
        batchFormData.append('labReport', formData.labReport);
      }

      const response = await fetch('/api/batches', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: batchFormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Batch update failed response:', errorData);
        throw new Error(errorData?.error || `Failed to update batch ${batchId}`);
      }
    }

    // Update local state
    const updatedBatches = batches.map(batch => {
      if (selectedBatches.includes(batch.id) && batch.apiaries && batch.apiaries.length > 0) {
        return {
          ...batch,
          status: 'completed',
          jarCertifications: jarCertifications,
          apiaries: batch.apiaries.map(apiary => {
            const storedValue = apiaryHoneyValues[`${batch.id}-${apiary.number}`];
            return {
              ...apiary,
              kilosCollected: storedValue !== undefined ? storedValue : apiary.kilosCollected
            };
          })
        };
      }
      return batch;
    });

    setBatches(updatedBatches);
    setShowCompleteForm(false);
    setSelectedBatches([]);
    setFormData({
      certificationType: '',
      productionReport: null,
      labReport: null,
      apiaries: []
    });

    setNotification({
      show: true,
      message: "Batch information completed successfully!",
      type: 'success'
    });

    setTimeout(() => {
      setShowProfileNotification(true);
    }, 500);

  } catch (error) {
    console.error('Error completing batches:', error);
    
    // RESTORE TOKEN BALANCE ON ERROR
    const originalBalance = parseInt(localStorage.getItem('tokenBalance') || '0') + tokensUsed;
    localStorage.setItem('tokenBalance', originalBalance.toString());
    setTokenBalance(originalBalance);
    
    // Dispatch restore event
    window.dispatchEvent(new CustomEvent('tokensUpdated', {
      detail: { 
        action: 'restore',
        tokensRestored: tokensUsed,
        newBalance: originalBalance
      }
    }));

    setNotification({
      show: true,
      message: error.message,
      type: 'error'
    });
  } finally {
    setIsLoading(false);
  }
};

async function saveApiaryToDatabase(apiaryData: any) {
    console.log('=== SAVING APIARY - SINGLE SAVE ===');
    console.log('Raw apiaryData received:', apiaryData);
    
    try {
      // INPUT VALIDATION
      if (!apiaryData.name || !apiaryData.number) {
        throw new Error('Apiary name and number are required');
      }
  
      // Enhanced location validation
      if (!apiaryData.location) {
        throw new Error('Location is required');
      }
  
      // Extract and validate coordinates
      let latitude, longitude;
      
      if (typeof apiaryData.location === 'object') {
        latitude = apiaryData.location.latitude;
        longitude = apiaryData.location.longitude;
      } else {
        throw new Error('Location must be an object with latitude and longitude');
      }
       const tokensNeeded = getTotalJarsAcrossApiaries();

      // After successful batch completion, update token balance
    const currentBalance = parseInt(localStorage.getItem('tokenBalance') || '0');
    const newBalance = currentBalance - tokensNeeded;
    
    // Update localStorage
    localStorage.setItem('tokenBalance', newBalance.toString());

     // Dispatch custom event to update token balance across the app
    window.dispatchEvent(new CustomEvent('tokensUpdated', {
      detail: { 
        action: 'deduct',
        tokensDeducted: tokensNeeded,
        newBalance: newBalance,
        batchIds: selectedBatches,
        jarCount: tokensNeeded
      }
    }));

      // Convert to numbers and validate
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
  
      if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates:', { latitude, longitude, lat, lng });
        throw new Error('Invalid latitude or longitude values');
      }
  
      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
  
      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }
  
      // PREPARE DATA - Send structure that matches your API interface
      const dataForAPI = {
        name: String(apiaryData.name).trim(),
        number: String(apiaryData.number).trim(),
        hiveCount: Math.max(0, parseInt(apiaryData.hiveCount) || 0),
        honeyCollected: Math.max(0, parseFloat(apiaryData.honeyCollected) || 0),
        location: {
          latitude: lat,
          longitude: lng
        }
      };
  
      console.log('Data being sent to API:', dataForAPI);
  
      // Get auth token
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth-token') ||
                 localStorage.getItem('token') ||
                 sessionStorage.getItem('auth-token');
      }
  
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
  
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      console.log('Making SINGLE POST request to /api/apiaries');
  
      // SINGLE API CALL - This will create ONE apiary with a batchId
      const response = await fetch('/api/apiaries', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(dataForAPI)
      });
  
      console.log('Response status:', response.status);
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        
        let errorMessage = 'Failed to save apiary';
  
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication failed. Please log in again.';
            break;
          case 409:
            errorMessage = errorData.message || errorData.error || 'An apiary with this name or number already exists.';
            break;
          case 400:
            errorMessage = errorData.message || errorData.error || 'Invalid data provided.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = errorData.message || errorData.error || errorMessage;
        }
  
        throw new Error(errorMessage);
      }
  
      const result = await response.json();
      console.log('Apiary saved successfully:', result);
  
      // Return the created apiary
      return result;
  
    } catch (error) {
      console.error('Error in saveApiaryToDatabase:', error);
      throw error;
    }
  }
  
   
  const refreshApiariesFromDatabase = async () => {
    try {
      console.log('=== REFRESH APIARIES DEBUG ===');
      
      // Enhanced token retrieval with better debugging
      let token = null;
      
      if (typeof window !== 'undefined') {
        // Check localStorage first
        token = localStorage.getItem('auth-token');
        console.log('localStorage token:', token ? 'exists' : 'missing');
        
        // Check sessionStorage as fallback
        if (!token) {
          token = sessionStorage.getItem('auth-token');
          console.log('sessionStorage token:', token ? 'exists' : 'missing');
        }
        
        // Check for other possible token names
        if (!token) {
          token = localStorage.getItem('token') || localStorage.getItem('authToken');
          console.log('Alternative token names:', token ? 'exists' : 'missing');
        }
      }
      
      // Check cookies as last resort
      if (!token && typeof document !== 'undefined') {
        const cookieToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1];
        
        if (cookieToken) {
          token = cookieToken;
          console.log('Cookie token found');
        }
      }
      
      console.log('Final token status:', token ? 'exists' : 'MISSING');
      
      // If no token found, throw early
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Create headers with proper token format
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Always include if we have a token
      };
      
      console.log('Request headers:', {
        ...headers,
        'Authorization': token ? 'Bearer [TOKEN_EXISTS]' : 'MISSING'
      });
      
      const response = await fetch('/api/apiaries', {
        method: 'GET',
        credentials: 'include', // This ensures cookies are sent
        headers,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Refresh API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 401) {
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token');
            sessionStorage.removeItem('auth-token');
          }
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(`Failed to fetch apiaries: ${response.status} ${response.statusText}`);
      }
      
      const apiaries = await response.json();
      console.log('Fetched apiaries count:', apiaries.length);
      
      setAvailableApiaries(apiaries);
      console.log('Apiaries list refreshed successfully!');
      
    } catch (error: unknown) {
      console.error('Error refreshing apiaries:', error);
      
      if (error instanceof Error) {
        if (
          error.message.includes('401') ||
          error.message.toLowerCase().includes('authentication') ||
          error.message.includes('No authentication token')
        ) {
          console.error('Authentication failed during refresh');
          // Show user-friendly message
          alert('Your session has expired. Please log in again.');
          // Redirect to login page
          window.location.href = '/login';
        } else {
          // Show other errors to user
          alert(`Failed to load apiaries: ${error.message}`);
        }
      } else {
        console.error('Unexpected error:', error);
        alert('An unexpected error occurred while loading apiaries.');
      }
    }
  };
  useEffect(() => {
    refreshApiariesFromDatabase();
  }, []);



  const getTotalHoneyFromApiaries = () => {
  return formData.apiaries.reduce((total, apiary) => total + (apiary.kilosCollected || 0), 0);
};

  useEffect(() => {
  const totalWeight = (jarSizeDistribution.jar250g * 0.25) + 
                     (jarSizeDistribution.jar400g * 0.4) + 
                     (jarSizeDistribution.jar600g * 0.6);
  
  const totalJars = jarSizeDistribution.jar250g + jarSizeDistribution.jar400g + jarSizeDistribution.jar600g;
  
}, [jarSizeDistribution, tokenBalance, certificationAmounts]);
  

  // Handle apiary form field changes
 

  // Refresh data from API
  const refreshData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Get token from storage
    const token = localStorage.getItem('authtoken') ||
                  localStorage.getItem('auth_token') ||
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('authtoken') ||
                  sessionStorage.getItem('auth_token') ||
                  sessionStorage.getItem('token');
    
    // Fetch batches
    const batchesResponse = await fetch('/api/batches', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!batchesResponse.ok) {
      throw new Error('Failed to fetch batches');
    }
    
    //const batchesData = await batchesResponse.json();
    //setBatches(batchesData);
    const { batches: batchesArray } = await batchesResponse.json();
    setBatches(batchesArray);
    setLastUpdated(new Date().toLocaleTimeString());
    
    try {
      // Fetch token stats in a separate try-catch to not fail if tokens can't be loaded
      const tokenStatsResponse = await fetch('/api/tokens/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (tokenStatsResponse.ok) {
        const tokenStatsData = await tokenStatsResponse.json();
        setTokenStats(tokenStatsData);
      } else {
        console.warn('Failed to fetch token stats');
        // Initialize with sensible defaults if API fails
        setTokenStats({
          totalTokens: 0,
          remainingTokens: 0,
          originOnly: 0,
          qualityOnly: 0,
          bothCertifications: 0
        });
      }
    } catch (tokenError) {
      console.error('Error fetching token stats:', tokenError);
      // Initialize with sensible defaults if API fails
      setTokenStats({
        totalTokens: 0,
        remainingTokens: 0,
        originOnly: 0,
        qualityOnly: 0,
        bothCertifications: 0
      });
    }
    
  } catch (error) {
    console.error('Error refreshing data:', error);
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
  
  // Filter and sort batches
  const filteredBatches = Array.isArray(batches)
  ? batches
      .filter(batch => {
        const matchesSearch =
          batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          batch.name.toLowerCase().includes(searchTerm.toLowerCase());

        return filterStatus === 'all'
          ? matchesSearch
          : matchesSearch && batch.status === filterStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        // If these can be string or number, cast or handle both
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      })
  : [];

  // Certification pie chart data for a specific batch
 const getCertificationData = (batch: {
  certificationStatus?: {
    originOnly?: number;
    qualityOnly?: number;
    bothCertifications?: number;
    uncertified?: number;
  };
}) => {
  const certStatus = batch.certificationStatus || {
    originOnly: 0,
    qualityOnly: 0,
    bothCertifications: 0,
    uncertified: 0
  };

  return [
    { name: 'Origin Only', value: certStatus.originOnly || 0, color: '#3182CE' },
    { name: 'Quality Only', value: certStatus.qualityOnly || 0, color: '#38A169' },
    { name: 'Both Certifications', value: certStatus.bothCertifications || 0, color: '#805AD5' },
    { name: 'Uncertified', value: certStatus.uncertified || 0, color: '#CBD5E0' }
  ];
};

  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '' });
  // Add these to your state declarations
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

// Handler for the delete button click
const handleDelete = () => {
  if (selectedBatches.length > 0) {
    setShowDeleteConfirmation(true);
  }
};

// Handler for confirming the delete operation
const confirmDelete = async () => {
  try {
    setIsDeleting(true);

    for (const batchId of selectedBatches) {
      try {
        const token = localStorage.getItem('authtoken') ||
                      localStorage.getItem('auth_token') ||
                      localStorage.getItem('token') ||
                      sessionStorage.getItem('authtoken') ||
                      sessionStorage.getItem('auth_token') ||
                      sessionStorage.getItem('token');

        const response = await fetch(`/api/batches?batchId=${batchId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        // Check if response is ok
        if (!response.ok) {
          // Try to parse error message from response
          let errorMessage = 'Failed to delete batch';
          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            if (text) errorMessage = text;
          }

          throw new Error(errorMessage);
        }

        console.log(`Successfully deleted batch: ${batchId}`);

      } catch (error) {
        console.error(`Error deleting batch ${batchId}:`, error);

        setNotification({
          show: true,
          message: `Error deleting batch: ${error.message}`,
          type: 'error'
        });

        // Exit loop on first error
        break;
      }
    }

    // Refresh after successful deletions
    await refreshData();

    setNotification({
      show: true,
      message: `Successfully deleted ${selectedBatches.length} batch${selectedBatches.length > 1 ? 'es' : ''}`,
      type: 'success'
    });

    setSelectedBatches([]);
    setSelectAll(false);

  } catch (error) {
    console.error('Error in batch deletion process:', error);
    setNotification({
      show: true,
      message: `Error: ${error.message}`,
      type: 'error'
    });
  } finally {
    setIsDeleting(false);
    setShowDeleteConfirmation(false);
  }
};
// Add these state variables to your component
// Replace the above with:
const [apiaryJars, setApiaryJars] = useState<{[key: number]: CustomJar[]}>({});
const [newJarForApiary, setNewJarForApiary] = useState<{[key: number]: Omit<CustomJar, 'id'>}>({});
const [jarCertifications, setJarCertifications] = useState<JarCertifications>({});

const getSelectedType = (certificationState) => {
  const { origin, quality } = certificationState || {};
  if (origin && quality) return 'both';
  if (origin) return 'origin';
  if (quality) return 'quality';
  return null;
};

// Add these helper functions
const hasRequiredCertifications = () => {
  return Object.values(apiaryJars).flat().every(jar => jarCertifications[jar.id]?.selectedType);
};

const needsProductionReport = () => {
  return Object.values(jarCertifications).some(cert => 
    cert?.selectedType === 'origin' || cert?.selectedType === 'both'
  );
};

const needsLabReport = () => {
  return Object.values(jarCertifications).some(cert => 
    cert?.selectedType === 'quality' || cert?.selectedType === 'both'
  );
};
const tokenCalculation = useMemo(() => {
  const allJars = Object.values(apiaryJars).flat();
  const totalJars = allJars.reduce((sum, jar) => sum + jar.quantity, 0);
  const tokensNeeded = totalJars;
  const remaining = tokenBalance - tokensNeeded;
  
  return {
    tokensNeeded,
    remaining,
    isValid: remaining >= 0,
    hasExceededJars: false
  };
}, [apiaryJars, tokenBalance]);

useEffect(() => {
  // Initialize token balance
  const initialBalance = parseInt(localStorage.getItem('tokenBalance') || '0');
  setTokenBalance(initialBalance);

  // Listen for custom token update events from buy tokens page
  const handleTokensUpdated = (event: Event) => {
    const customEvent = event as CustomEvent<{ newBalance: number }>;
    setTokenBalance(customEvent.detail.newBalance);
  };

  // Listen for storage changes
  const handleStorageChange = (e) => {
    if (e.key === 'tokenBalance') {
      setTokenBalance(parseInt(e.newValue || '0'));
    }
  };

  window.addEventListener('tokensUpdated', handleTokensUpdated);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('tokensUpdated', handleTokensUpdated);
    window.removeEventListener('storage', handleStorageChange);
  };
}, []);

useEffect(() => {
  const initMaps = () => {
    if (window.google) {
      console.log('Initializing maps...');
      
      // Common map configuration
      const mapConfig = {
        center: { lat: 52.0907, lng: 5.1214 }, // Netherlands coordinates
        zoom: 8,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_CENTER,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
        fullscreenControl: true
      };

      // Initialize main map for displaying apiary markers
      if (mapRef.current) {
        console.log('Initializing main map...');
        const map = new window.google.maps.Map(mapRef.current, mapConfig);
        googleMapRef.current = map;
        console.log('Main map initialized');

        // Add apiary markers to main map
        addApiaryMarkersToMap(map);
      } else {
        console.log('Main map ref not found');
      }

      // Initialize mini map with better timing and error handling
      const initMiniMap = (attempt = 1) => {
        console.log(`Mini map initialization attempt ${attempt}`);
        
        if (miniMapRef.current) {
          console.log('Mini map ref found, initializing...');
          
          try {
            const miniMapConfig = {
              ...mapConfig,
              zoom: 6, // Slightly different zoom for mini map
              zoomControl: false, // Custom zoom controls in overlay
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false
            };

            const miniMap = new window.google.maps.Map(miniMapRef.current, miniMapConfig);
            miniGoogleMapRef.current = miniMap;
            console.log('Mini map instance created successfully');
            
            // Force resize after a short delay to ensure proper rendering
            setTimeout(() => {
              console.log('Triggering mini map resize...');
              window.google.maps.event.trigger(miniMap, 'resize');
              miniMap.setCenter(mapConfig.center);
            }, 100);

            // Add click listener to mini map for apiary creation
            miniMap.addListener('click', (event: any) => {
              handleMiniMapClick(event);
            });
            
            console.log('Mini map initialization complete');
            
          } catch (error) {
            console.error('Error creating mini map:', error);
            
            
          }
        } else {
          console.log(`Mini map ref not found on attempt ${attempt}`);
          
          // Retry up to 5 times with increasing delays
          if (attempt < 5) {
            setTimeout(() => initMiniMap(attempt + 1), attempt * 500);
          } else {
            console.error('Failed to initialize mini map after 5 attempts');
          }
        }
      };
      
      // Start mini map initialization with delay to ensure modal is rendered
      setTimeout(() => initMiniMap(), 200);
    }
  };

  // Function to add apiary markers to the main map
  // Function to add apiary markers to the main map
const addApiaryMarkersToMap = (map: any) => {
  // Clear existing markers
  if (apiaryMarkers.current && Array.isArray(apiaryMarkers.current)) {
    apiaryMarkers.current.forEach((marker: any) => marker.setMap(null));
  }
  apiaryMarkers.current = [];

  // Add markers for each apiary
  if (Array.isArray(availableApiaries) && availableApiaries.length > 0) {
    console.log('Adding apiary markers:', availableApiaries.length);
    
    availableApiaries.forEach((apiary, index) => {
      if (index < 3) { // Only log first 3 to avoid spam
        console.log('Full apiary object:', JSON.stringify(apiary, null, 2));
      }

      console.log('Processing apiary:', apiary.name, 'Latitude:', apiary.latitude, 'Longitude:', apiary.longitude);

      // Check if apiary has coordinates (either in nested location or directly on apiary)
      const hasNestedLocation = apiary.location && apiary.location.latitude && apiary.location.longitude;
      const hasDirectCoordinates = apiary.latitude && apiary.longitude;

      if (hasNestedLocation || hasDirectCoordinates) {
        // Get coordinates from the appropriate location
        const lat = hasNestedLocation 
          ? (typeof apiary.location.latitude === 'string' ? parseFloat(apiary.location.latitude) : apiary.location.latitude)
          : (typeof apiary.latitude === 'string' ? parseFloat(apiary.latitude) : apiary.latitude);
        
        const lng = hasNestedLocation 
          ? (typeof apiary.location.longitude === 'string' ? parseFloat(apiary.location.longitude) : apiary.location.longitude)
          : (typeof apiary.longitude === 'string' ? parseFloat(apiary.longitude) : apiary.longitude);
        
        console.log('Creating marker at:', { lat, lng });

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: `${apiary.name} (${apiary.number})`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#FCD34D;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <path d="M20 0C13.373 0 8 5.373 8 12c0 9 12 28 12 28s12-19 12-28c0-6.627-5.373-12-12-12z" fill="url(#grad)" stroke="#D97706" stroke-width="2"/>
                <circle cx="20" cy="12" r="6" fill="white"/>
                <text x="20" y="17" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#F59E0B">🍯</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(40, 50),
            anchor: new window.google.maps.Point(20, 50)
          },
          animation: window.google.maps.Animation.DROP
        });

        // Add hover info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
                ${apiary.name}
              </h3>
              <div style="color: #6b7280; font-size: 14px; line-height: 1.4;">
                <div><strong>ID:</strong> ${apiary.number}</div>
                <div><strong>Hives:</strong> ${apiary.hiveCount}</div>
                <div><strong>Honey:</strong> ${apiary.kilosCollected || apiary.honeyCollected || 0} kg</div>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                Click for more details
              </div>
            </div>
          `
        });

        // Add event listeners
        marker.addListener('click', () => {
          console.log('Apiary marker clicked:', apiary.name);
          // Create a normalized apiary object for the modal
          const normalizedApiary = {
            ...apiary,
            location: hasNestedLocation ? apiary.location : {
              latitude: lat,
              longitude: lng
            },
            honeyCollected: apiary.kilosCollected || apiary.honeyCollected || 0
          };
          setSelectedApiary(normalizedApiary);
        });

        // Show info window on hover
        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker);
        });

        // Hide info window when mouse leaves
        marker.addListener('mouseout', () => {
          infoWindow.close();
        });

        // Store marker reference
        if (Array.isArray(apiaryMarkers.current)) {
          apiaryMarkers.current.push(marker);
        }
      } else {
        console.log('Apiary has no valid coordinates:', apiary.name);
      }
    });

    // Adjust map bounds to fit all markers if there are any
    if (apiaryMarkers.current && Array.isArray(apiaryMarkers.current) && apiaryMarkers.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      apiaryMarkers.current.forEach((marker: any) => {
        const position = marker.getPosition();
        if (position) {
          bounds.extend(position);
        }
      });
      
      if (apiaryMarkers.current.length === 1) {
        // If only one marker, center on it with a reasonable zoom
        const position = apiaryMarkers.current[0].getPosition();
        if (position) {
          map.setCenter(position);
          map.setZoom(15);
        }
      } else {
        // If multiple markers, fit bounds
        map.fitBounds(bounds);
        
        // Ensure minimum zoom level
        const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
          if (map.getZoom() && map.getZoom() > 18) {
            map.setZoom(18);
          }
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  } else {
    console.log('No apiaries to display on map');
  }
};

  // Helper function to handle mini map clicks for apiary creation
  const handleMiniMapClick = (event: any) => {
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    
    if (!lat || !lng) return;
    
    console.log('Mini map clicked for apiary location:', { lat, lng });
    
    // Update the apiary form data with the selected location - FIXED TYPE ISSUE
    setApiaryFormData((prev) => ({
  ...prev,
  location: {
    lat: lat,
    lng: lng,
    latitude: lat,
    longitude: lng,
    name: `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    id: Date.now()
  }
}));
    // Add a temporary marker to show selected location
    if (tempMarker.current) {
      tempMarker.current.setMap(null);
    }
    
    if (miniGoogleMapRef.current) {
      tempMarker.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: miniGoogleMapRef.current,
        title: 'Selected Apiary Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 0C9.477 0 5 4.477 5 10c0 7.5 10 25 10 25s10-17.5 10-25c0-5.523-4.477-10-10-10z" fill="#10B981" stroke="#059669" stroke-width="2"/>
              <circle cx="15" cy="10" r="4" fill="white"/>
              <text x="15" y="15" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="#10B981">✓</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(30, 40),
          anchor: new window.google.maps.Point(15, 40)
        }
      });
    }
  };

  // Load Google Maps API if not already loaded
  if (!window.google) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.onload = initMaps;
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  } else {
    initMaps();
  }

  // Cleanup function
  return () => {
    // Clean up any event listeners if needed
    if (googleMapRef.current) {
      window.google?.maps?.event?.clearInstanceListeners(googleMapRef.current);
    }
    if (miniGoogleMapRef.current) {
      window.google?.maps?.event?.clearInstanceListeners(miniGoogleMapRef.current);
    }
    
    // Clean up markers
    if (apiaryMarkers.current && Array.isArray(apiaryMarkers.current)) {
      apiaryMarkers.current.forEach((marker: any) => marker.setMap(null));
    }
    if (tempMarker.current) {
      tempMarker.current.setMap(null);
    }
  };
}, [showApiaryModal, availableApiaries]);


 
// Helper function to get jars for a specific apiary
const getJarsForApiary = (apiaryIndex: number) => {
  return apiaryJars[apiaryIndex] || [];
};

// Helper function to get total jars across all apiaries
const getTotalJarsAcrossApiaries = () => {
  return Object.values(apiaryJars).flat().reduce((sum, jar) => sum + jar.quantity, 0);
};

// Helper function to add jar to specific apiary
const addJarToApiary = (apiaryIndex: number) => {
  const newJar = newJarForApiary[apiaryIndex];
  const jarSize = newJar?.size;
  const jarQuantity = newJar?.quantity || 1;

  if (!jarSize || jarSize <= 0) return;

  const remainingHoney = getRemainingHoneyForApiary(apiaryIndex);
  const requiredHoney = (jarSize * jarQuantity) / 1000;

  if (requiredHoney > remainingHoney + 0.001) {
    alert(
      `Cannot add ${jarQuantity} jars of ${jarSize}g. Only ${remainingHoney.toFixed(
        2
      )} kg of honey remaining for this apiary.`
    );
    return;
  }

  const apiary = formData.apiaries[apiaryIndex];
  const currentJarsForApiary = getJarsForApiary(apiaryIndex);
  const currentTotalWeight = currentJarsForApiary.reduce(
    (sum, jar) => sum + (jar.size * jar.quantity) / 1000,
    0
  );

  const newJarWeight = (jarSize * jarQuantity) / 1000;

  if (currentTotalWeight + newJarWeight <= apiary.kilosCollected) {
    setApiaryJars({
      ...apiaryJars,
      [apiaryIndex]: [
        ...currentJarsForApiary,
        {
          id: Date.now(),
          size: jarSize,
          quantity: jarQuantity,
          apiaryIndex,
        },
      ],
    });

    // Reset the new jar input for this apiary
    setNewJarForApiary({
      ...newJarForApiary,
      [apiaryIndex]: { size: 0, quantity: 1 },
    });
  } else {
    alert(
      `Cannot add jars. Total weight would exceed honey available for this apiary (${apiary.kilosCollected} kg)`
    );
  }
};

// Helper function to remove jar from specific apiary
const removeJarFromApiary = (apiaryIndex: number, jarId: number) => {
  setApiaryJars({
    ...apiaryJars,
    [apiaryIndex]: getJarsForApiary(apiaryIndex).filter(jar => jar.id !== jarId)
  });
};


  if (!tokenStats) {
  // This will show during data loading after deletion or initial load
  return (
    <div className="flex flex-col space-y-6 p-6 min-h-screen bg-gradient-to-b from-yellow-200 to-white text-black">
      {/* Keep the notification visible even during loading */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg flex items-center ${
          notification.type === 'error' ? 'bg-red-600 text-white' : 
          notification.type === 'success' ? 'bg-green-600 text-white' : 
          'bg-gray-800 text-white'
        }`}>
          {notification.type === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
          {notification.type === 'success' && <Check className="h-4 w-4 mr-2" />}
          {notification.message}
          <button 
            onClick={() => setNotification({ ...notification, show: false })}
            className="ml-2 text-gray-300 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="bg-white p-8 rounded-lg shadow flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    </div>
  );
}

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
      
      {/* Header */}
<header className="relative bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20 text-black overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-amber-500/5"></div>
  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-full blur-2xl"></div>
  
  <div className="relative z-10 flex justify-between items-center">
    <div className="flex items-center">
      <button 
        onClick={toggleSidebar}
        className="mr-6 p-3 rounded-xl hover:bg-yellow-100/50 transition-all duration-300 hover:scale-110 hover:rotate-12"
      >
        <Menu className="h-7 w-7" />
      </button>
      <div className="flex items-center">
        <div className="mr-4 bg-gradient-to-br from-yellow-500 to-amber-500 p-3 rounded-2xl shadow-lg transform hover:scale-110 transition-all duration-300">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM6 14C5.45 14 5 13.55 5 13C5 12.45 5.45 12 6 12C6.55 12 7 12.45 7 13C7 13.55 6.55 14 6 14ZM9 9C8.45 9 8 8.55 8 8C8 7.45 8.45 7 9 7C9.55 7 10 7.45 10 8C10 8.55 9.55 9 9 9ZM15 9C14.45 9 14 8.55 14 8C14 7.45 14.45 7 15 7C15.55 7 16 7.45 16 8C16 8.55 15.55 9 15 9ZM18 14C17.45 14 17 13.55 17 13C17 12.45 17.45 12 18 12C18.55 12 19 12.45 19 13C19 13.55 18.55 14 18 14Z" fill="white"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">HoneyCertify</h1>
          <p className="text-sm text-gray-500 font-medium">Batch Management</p>
        </div>
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      {/* Refresh Button */}
      <button
        onClick={refreshData}
        className="group relative overflow-hidden p-3 
                   bg-gradient-to-r from-blue-600 to-indigo-500 
                   text-white rounded-xl shadow-2xl
                   transform transition-all duration-500 
                   hover:from-blue-500 hover:to-indigo-400 
                   hover:scale-110 hover:shadow-blue-500/30 hover:-translate-y-1
                   active:scale-95 active:translate-y-0
                   border border-blue-400/20"
        title="Refresh data"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                       transform -skew-x-12 -translate-x-full 
                       group-hover:translate-x-full transition-transform duration-700"></div>
        
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-indigo-400 
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
        
        <RefreshCw className="h-6 w-6 relative z-10 transition-all duration-300 
                           group-hover:rotate-180 group-hover:scale-110" />
      </button>
      
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={selectedBatches.length === 0}
        className={`group relative overflow-hidden px-6 py-3 rounded-xl font-semibold shadow-2xl
                   transform transition-all duration-500 flex items-center
                   ${selectedBatches.length === 0 
                     ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                     : `bg-gradient-to-r from-red-600 to-rose-500 text-white
                        hover:from-red-500 hover:to-rose-400 
                        hover:scale-105 hover:shadow-red-500/30 hover:-translate-y-2
                        active:scale-95 active:translate-y-0
                        border border-red-400/20`
                   }`}
      >
        {selectedBatches.length > 0 && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                           transform -skew-x-12 -translate-x-full 
                           group-hover:translate-x-full transition-transform duration-600"></div>
            
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400 to-rose-400 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            
            <div className="absolute top-1 right-2 w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
          </>
        )}
        
        <Trash2 className={`h-5 w-5 mr-3 relative z-10 transition-all duration-300 
                          ${selectedBatches.length > 0 ? 'group-hover:-rotate-12 group-hover:scale-110' : ''}`} />
        <span className={`relative z-10 transition-all duration-300 
                        ${selectedBatches.length > 0 ? 'group-hover:tracking-wider' : ''}`}>
          Delete {selectedBatches.length > 0 ? `(${selectedBatches.length})` : ''}
        </span>
        {selectedBatches.length > 0 && (
          <div className="w-1 h-1 ml-2 relative z-10 bg-red-200 rounded-full 
                         opacity-0 group-hover:opacity-100 animate-ping"></div>
        )}
      </button>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={selectedBatches.length === 0}
        className={`group relative overflow-hidden px-6 py-3 rounded-xl font-semibold shadow-2xl
                   transform transition-all duration-500 flex items-center
                   ${selectedBatches.length === 0 
                     ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                     : `bg-gradient-to-r from-emerald-600 to-green-500 text-white
                        hover:from-emerald-500 hover:to-green-400 
                        hover:scale-105 hover:shadow-green-500/30 hover:-translate-y-2
                        active:scale-95 active:translate-y-0
                        border border-green-400/20`
                   }`}
      >
        {selectedBatches.length > 0 && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                           transform -skew-x-12 -translate-x-full 
                           group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-green-400 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
            
            <div className="absolute top-1 right-2 w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          </>
        )}
        
        <Printer className={`h-5 w-5 mr-3 relative z-10 transition-all duration-300 
                           ${selectedBatches.length > 0 ? 'group-hover:rotate-12 group-hover:scale-110' : ''}`} />
        <span className={`relative z-10 transition-all duration-300 
                        ${selectedBatches.length > 0 ? 'group-hover:tracking-wider' : ''}`}>
          Print {selectedBatches.length > 0 ? `(${selectedBatches.length})` : ''}
        </span>
        {selectedBatches.length > 0 && (
          <Sparkles className="w-4 h-4 ml-2 relative z-10 opacity-0 transition-all duration-300 
                            group-hover:opacity-100 group-hover:rotate-180" />
        )}
      </button>
    </div>
  </div>
  
  <p className="text-gray-600 text-sm mt-4 relative z-10 opacity-75">
    Last updated: {lastUpdated}
  </p>
</header>

{/* Delete confirmation dialog */}
{showDeleteConfirmation && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
    <div className="relative bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-rose-500/5"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/10 to-transparent rounded-full blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center text-red-500 mb-6">
          <div className="p-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl mr-3 shadow-lg">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-xl bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            Delete Confirmation
          </h3>
        </div>
        
        {isDeleting ? (
          <div className="text-center py-8">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-red-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-600 font-medium">Deleting batches...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to delete {selectedBatches.length} {selectedBatches.length === 1 ? 'batch' : 'batches'}? This action cannot be undone.
            </p>
            
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="p-1 bg-yellow-400 rounded-full">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    All associated apiaries and certification data will also be deleted.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3 font-medium">The following batches will be deleted:</p>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {selectedBatches.map(batchId => {
                  const batch = batches.find(b => b.id === batchId);
                  return batch ? (
                    <span key={batchId} className="inline-flex px-3 py-1 bg-gradient-to-r from-red-100 to-rose-100 
                                                   text-red-800 text-sm rounded-full border border-red-200 font-medium">
                      {batch.batchNumber}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="group relative overflow-hidden px-6 py-3 
                           bg-gradient-to-r from-gray-100 to-gray-200 
                           text-gray-700 rounded-xl font-semibold
                           transform transition-all duration-300 
                           hover:from-gray-200 hover:to-gray-300 
                           hover:scale-105 hover:shadow-lg
                           active:scale-95 border border-gray-300"
              >
                <span className="relative z-10">Cancel</span>
              </button>
              
              <button
                onClick={confirmDelete}
                className="group relative overflow-hidden px-6 py-3 
                           bg-gradient-to-r from-red-600 to-rose-500 
                           text-white rounded-xl font-semibold shadow-xl
                           transform transition-all duration-300 
                           hover:from-red-500 hover:to-rose-400 
                           hover:scale-105 hover:shadow-red-500/30
                           active:scale-95 flex items-center
                           border border-red-400/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                               transform -skew-x-12 -translate-x-full 
                               group-hover:translate-x-full transition-transform duration-600"></div>
                
                <Trash2 className="h-4 w-4 mr-2 relative z-10 transition-transform duration-300 
                                 group-hover:rotate-12" />
                <span className="relative z-10">Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}

{/* Notification */}
{notification.show && (
  <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center 
                  backdrop-blur-xl border transform transition-all duration-500 
                  hover:scale-105 ${
    notification.type === 'error' ? 'bg-red-500/90 text-white border-red-400/20' : 
    notification.type === 'success' ? 'bg-green-500/90 text-white border-green-400/20' : 
    'bg-gray-800/90 text-white border-gray-700/20'
  }`}>
    <div className="flex items-center">
      {notification.type === 'error' && (
        <div className="p-1 bg-red-400 rounded-full mr-3">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
      )}
      {notification.type === 'success' && (
        <div className="p-1 bg-green-400 rounded-full mr-3">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      <span className="font-medium">{notification.message}</span>
      <button 
        onClick={() => setNotification({ ...notification, show: false })}
        className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  </div>
)}
      {/* Create Batch Modal */}
{showBatchModal && (
  <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-30">
    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto mx-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Create New Batch</h3>
        <button
          onClick={() => {
            setShowBatchModal(false);
            setBatchNumber('');
            setBatchName('');
            setSelectedApiaries([]);
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

      {/* Select Apiaries Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-lg">Select Apiaries</h4>
          <button
            type="button"
            onClick={() => setShowApiaryModal(true)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md border border-blue-200 hover:bg-blue-50"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add New Apiary
          </button>
        </div>

        {/* Apiary Selection Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Apiaries <span className="text-red-500">*</span>
          </label>
          
          {isLoadingApiaries ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <p className="text-gray-500">Loading apiaries...</p>
            </div>
          ) : !Array.isArray(availableApiaries) || availableApiaries.length === 0 ? (
            <div
              className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50"
              onClick={() => setShowApiaryModal(true)}
            >
              <PlusCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 font-medium">No apiaries available</p>
              <p className="text-xs text-gray-400 mt-1">Click to create your first apiary</p>
            </div>
          ) : (
            <select
              value={selectedDropdownApiary || ""}
              onChange={(e) => {
                const apiaryId = e.target.value;
                console.log('Selected apiary ID (string):', apiaryId, typeof apiaryId);
                
                setSelectedDropdownApiary(apiaryId);
                
                if (apiaryId) {
                  // Find the selected apiary using flexible matching
                  const apiary = availableApiaries.find(a => {
                    // Convert both values to strings for consistent comparison
                    const apiaryIdStr = String(a.id);
                    const searchIdStr = String(apiaryId);
                    
                    return apiaryIdStr === searchIdStr;
                  });
                  
                  console.log('Available apiaries:', availableApiaries.map(a => ({id: a.id, type: typeof a.id})));
                  console.log('Found apiary:', apiary);
                  
                  if (apiary) {
                    // Ensure selectedApiaries is an array
                    const currentSelected = Array.isArray(selectedApiaries) ? selectedApiaries : [];
                    
                    // Check if apiary is not already selected (using flexible ID matching)
                    const isAlreadySelected = currentSelected.some(a => 
                      a.id === apiary.id || 
                      String(a.id) === String(apiary.id)
                    );
                    
                    console.log('Is already selected:', isAlreadySelected);
                    
                    if (!isAlreadySelected) {
                      // Add the apiary with batchHoneyCollected property (separate from stored kilosCollected)
                      const newApiary = { 
                        ...apiary, 
                        batchHoneyCollected: 0 // This is the honey collected specifically for this batch
                      };
                      
                      setSelectedApiaries(prev => {
                        const prevArray = Array.isArray(prev) ? prev : [];
                        const newArray = [...prevArray, newApiary];
                        console.log('New selected apiaries:', newArray);
                        return newArray;
                      });
                      
                      // Reset dropdown after successful addition
                      setTimeout(() => setSelectedDropdownApiary(''), 100);
                    } else {
                      // Reset dropdown if apiary already selected
                      setSelectedDropdownApiary('');
                      alert('This apiary is already selected!');
                    }
                  } else {
                    console.error('Apiary not found with ID:', apiaryId);
                    console.error('Available apiaries IDs:', availableApiaries.map(a => `${a.id} (${typeof a.id})`));
                    setSelectedDropdownApiary('');
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Select an apiary to add...</option>
              {Array.isArray(availableApiaries) && 
                availableApiaries
                  .filter(apiary => {
                    const currentSelected = Array.isArray(selectedApiaries) ? selectedApiaries : [];
                    return !currentSelected.some(selected => 
                      selected.id === apiary.id || 
                      String(selected.id) === String(apiary.id)
                    );
                  })
                  .map(apiary => (
                    <option key={apiary.id} value={apiary.id}>
                      {apiary.name} (ID: {apiary.number}) - {apiary.hiveCount} hives
                    </option>
                  ))
              }
            </select>
          )}
        </div>

        {/* Selected Apiaries List */}
        {Array.isArray(selectedApiaries) && selectedApiaries.length > 0 && (
          <div className="space-y-4">
            <h5 className="font-medium text-gray-800">Selected Apiaries for this Batch:</h5>
            {selectedApiaries.map((apiary, index) => (
              <div key={apiary.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-800 text-lg">{apiary.name}</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {/* Apiary Information - Read Only */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Apiary ID/Number
                          </label>
                          <input
                            type="text"
                            value={apiary.number}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 text-sm cursor-not-allowed"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Number of Hives
                          </label>
                          <input
                            type="number"
                            value={apiary.hiveCount}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 text-sm cursor-not-allowed"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Total Honey Collected (kg)
                          </label>
                          <input
                            type="number"
                            value={apiary.kilosCollected || 0}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 text-sm cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Stored: {apiary.kilosCollected || 0}kg | 
                            Raw data: {JSON.stringify(apiary.kilosCollected)}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Location
                          </label>
                          <input
                            type="text"
                            value={
                              apiary.latitude !== undefined && apiary.longitude !== undefined
                                ? `${apiary.latitude?.toFixed(6)}, ${apiary.longitude?.toFixed(6)}` 
                                : 'No location set'
                            }
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 text-sm cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Location data: lat: {apiary.latitude}, lng: {apiary.longitude}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedApiaries(prev => {
                      const prevArray = Array.isArray(prev) ? prev : [];
                      return prevArray.filter(a => a.id !== apiary.id);
                    })}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center ml-4 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
                
                {/* Batch-specific honey collection - Mandatory */}
                <div className="border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Honey Collected for THIS Batch (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={apiary.kilosCollected || ''}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setSelectedApiaries(prev => {
                          const prevArray = Array.isArray(prev) ? prev : [];
                          return prevArray.map(a => 
                            a.id === apiary.id ? { ...a, batchHoneyCollected: newValue } : a
                          );
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="0.0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the amount of honey collected from this apiary specifically for this batch
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Section */}
      {selectedApiaries.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h5 className="font-medium text-blue-900 mb-3">Batch Summary</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-700 font-medium">Total Apiaries</p>
              <p className="text-blue-900 text-lg font-bold">{selectedApiaries.length}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Total Hives</p>
              <p className="text-blue-900 text-lg font-bold">
                {selectedApiaries.reduce((sum, apiary) => sum + (apiary.hiveCount || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Batch Honey (kg)</p>
              <p className="text-blue-900 text-lg font-bold">
                {selectedApiaries.reduce((sum, apiary) => sum + (apiary.batchHoneyCollected || 0), 0).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Total Stored Honey (kg)</p>
              <p className="text-blue-900 text-lg font-bold">
                {selectedApiaries.reduce((sum, apiary) => sum + (apiary.kilosCollected || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs">
        <p><strong>🔍 Apiary Data Debug:</strong></p>
        {Array.isArray(availableApiaries) && availableApiaries.map(apiary => (
          <div key={apiary.id} className="mt-2 p-2 bg-white rounded border">
            <p><strong>{apiary.name}</strong> (ID: {apiary.id})</p>
            <p>• Number: {apiary.number}</p>
            <p>• Hive Count: {apiary.hiveCount}</p>
            <p>• Kilos Collected: {apiary.kilosCollected} (type: {typeof apiary.kilosCollected})</p>
            <p>• Location: lat: {apiary.latitude}, lng: {apiary.longitude}</p>
            <p>• Full Object Keys: {Object.keys(apiary).join(', ')}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
        <p><strong>Debug Info:</strong></p>
        <p>Batch Number: "{batchNumber}" (length: {batchNumber?.length || 0})</p>
        <p>Selected Apiaries: {Array.isArray(selectedApiaries) ? selectedApiaries.length : 'Not an array'}</p>
        <p>All apiaries have batch honey defined?: {Array.isArray(selectedApiaries) && selectedApiaries.every(a => a.batchHoneyCollected !== undefined && a.batchHoneyCollected !== null && a.batchHoneyCollected !== '') ? 'YES' : 'NO'}</p>
        <p>Button should be enabled: {
          batchNumber?.trim() && 
          Array.isArray(selectedApiaries) && 
          selectedApiaries.length > 0 && 
          selectedApiaries.every(a => a.batchHoneyCollected !== undefined && a.batchHoneyCollected !== null && a.batchHoneyCollected !== '') ? 'YES' : 'NO'
        }</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={() => {
            setShowBatchModal(false);
            setBatchNumber('');
            setBatchName('');
            setSelectedApiaries([]);
            setSelectedDropdownApiary('');
          }}
          className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={createBatch}
          disabled={
            !batchNumber?.trim() || 
            !Array.isArray(selectedApiaries) || 
            selectedApiaries.length === 0 ||
            !selectedApiaries.every(apiary => apiary.batchHoneyCollected !== undefined && apiary.batchHoneyCollected !== null && apiary.batchHoneyCollected !== '')
          }
          className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${
            batchNumber?.trim() && 
            Array.isArray(selectedApiaries) && 
            selectedApiaries.length > 0 &&
            selectedApiaries.every(apiary => apiary.batchHoneyCollected !== undefined && apiary.batchHoneyCollected !== null && apiary.batchHoneyCollected !== '')
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

{/* Create Apiary Modal */}
{showApiaryModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Create New Apiary</h3>
              <p className="text-yellow-100 text-sm">Add a new apiary location to your collection</p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowApiaryModal(false);
              setApiaryFormData({
                name: '',
                number: '',
                hiveCount: 0,
                honeyCollected: 0,
                location: null
              });
            }}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modal Content */}
      <div className="flex flex-col lg:flex-row overflow-hidden" style={{ height: 'calc(90vh - 120px)' }}>
        {/* Left Panel - Form */}
        <div className="lg:w-1/2 p-6 overflow-y-auto bg-gray-50">
          <div className="space-y-6">
            {/* Apiary Details Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <div className="bg-blue-100 p-1 rounded mr-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                Apiary Details
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Apiary Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apiary Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={apiaryFormData.name}
                    onChange={(e) => setApiaryFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="e.g., Sunrise Meadow Apiary"
                    required
                    autoFocus
                  />
                </div>

                {/* Apiary Number/ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apiary Number/ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={apiaryFormData.number}
                    onChange={(e) => setApiaryFormData(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    placeholder="e.g., APY-001"
                    required
                  />
                </div>

                {/* Hive Count and Honey Collected - Side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Hives <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={apiaryFormData.hiveCount}
                      onChange={(e) => setApiaryFormData(prev => ({ ...prev, hiveCount: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Honey Collected (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={apiaryFormData.honeyCollected || 0}
                      onChange={(e) => setApiaryFormData(prev => ({ ...prev, honeyCollected: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>
            </div>

           <div className="bg-white p-4 rounded-lg shadow-sm border">
  <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
    <div className="bg-green-100 p-1 rounded mr-2">
      <MapPin className="h-4 w-4 text-green-600" />
    </div>
    Location Settings
  </h4>

  {/* Current Location Display */}
  {apiaryFormData.location ? (
    <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="bg-green-100 p-1 rounded mr-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="font-medium text-green-800">
              {apiaryFormData.location.name || 'Selected Location'}
            </p>
          </div>
          <p className="text-sm text-green-600 ml-7">
            📍 {apiaryFormData.location.latitude.toFixed(6)}, {apiaryFormData.location.longitude.toFixed(6)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setApiaryFormData(prev => ({ ...prev, location: null }))}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
          title="Remove location"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  ) : (
    <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
      <div className="flex items-center">
        <div className="bg-amber-100 p-1 rounded mr-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-sm text-amber-800">
          Click on the map or paste a Google Maps link to set the apiary location
        </p>
      </div>
    </div>
  )}

  {/* Google Maps Link Input Section */}
  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
    <div className="flex items-center mb-3">
      <div className="bg-blue-100 p-1 rounded mr-2">
        <Globe className="h-4 w-4 text-blue-600" />
      </div>
      <h5 className="font-medium text-blue-800">Set Location via Link or Coordinates</h5>
    </div>
    
    <p className="text-sm text-blue-600 mb-3">
      Paste a Google Maps link or enter coordinates directly
    </p>
    
    <div className="flex space-x-2">
      <input
        type="text"
        value={mapsLinkInput}
        onChange={(e) => setMapsLinkInput(e.target.value)}
        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        placeholder="https://maps.google.com/... or 25.2048, 55.2708"
      />
      <button
        type="button"
        onClick={handleMapsLinkSubmit}
        disabled={!mapsLinkInput.trim()}
        className={`px-4 py-2 rounded-lg text-white font-medium transition-all flex items-center space-x-1 ${
          mapsLinkInput.trim()
            ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        <MapPin className="h-4 w-4" />
        <span className="text-sm">Set</span>
      </button>
    </div>
    
    <div className="mt-3 text-xs text-blue-500">
      <p>💡 <strong>Supported formats:</strong></p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 ml-4">
        <div>
          <p><strong>📍 Direct Coordinates:</strong></p>
          <ul className="ml-2 space-y-1">
            <li>• 25.2048, 55.2708</li>
            <li>• 25.2048 55.2708</li>
          </ul>
        </div>
        <div>
          <p><strong>🔗 Google Maps Links:</strong></p>
          <ul className="ml-2 space-y-1">
            <li>• Full browser URLs</li>
            <li>• maps.google.com links</li>
            <li>• Place sharing links</li>
          </ul>
        </div>
      </div>
      <div className="mt-2 p-2 bg-blue-100 rounded text-blue-700">
        <p><strong>📱 For shortened links (goo.gl, maps.app.goo.gl):</strong></p>
        <p>Click "Set" and we'll help you get the full URL or coordinates!</p>
      </div>
    </div>
  </div>

  {/* Saved Locations Dropdown */}
  {savedApiaryLocations.length > 0 && (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Quick Select from Saved Locations
      </label>
      <select
        value=""
        onChange={(e) => {
          const locationId = e.target.value;
          if (locationId) {
            const selectedLocation = savedApiaryLocations.find(loc => loc.id === parseInt(locationId));
            if (selectedLocation) {
              console.log('Selected location from saved locations:', selectedLocation);
              
              // Create proper ApiaryLocation object
              const apiaryLocation = {
                id: selectedLocation.id,
                name: selectedLocation.name,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                lat: selectedLocation.latitude,  // Required by LocationCoordinates
                lng: selectedLocation.longitude, // Required by LocationCoordinates
                createdAt: selectedLocation.createdAt
              };
              
              setApiaryFormData(prev => ({
                ...prev,
                location: apiaryLocation
              }));

              // Center the map on the selected location
              if (miniGoogleMapRef.current) {
                const newCenter = new google.maps.LatLng(selectedLocation.latitude, selectedLocation.longitude);
                miniGoogleMapRef.current.setCenter(newCenter);
                miniGoogleMapRef.current.setZoom(15);
              }
            }
            (e.target as HTMLSelectElement).value = "";
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        <option value="">Select your location...</option>
        {savedApiaryLocations.map(location => (
          <option key={location.id} value={location.id}>
            {location.name} - Lat: {location.latitude?.toFixed(4)}, Lng: {location.longitude?.toFixed(4)}
          </option>
        ))}
      </select>
    </div>
  )}
</div>
          </div>
        </div>

        {/* Right Panel - Mini Map */}
        <div className="lg:w-1/2 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <div className="bg-blue-100 p-1 rounded mr-2">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              Interactive Location Map
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Click anywhere on the map to set your apiary location
            </p>
          </div>
          
          <div className="flex-1 p-4">
            <div className="h-full relative">
              <div 
                ref={miniMapRef}
                data-testid="mini-map"
                className="w-full h-full rounded-lg border-2 border-gray-300 cursor-crosshair shadow-inner bg-gray-100 relative overflow-hidden"
                style={{ 
                  minHeight: '400px',
                  height: '100%'
                }}
              >
                {/* Loading indicator */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading map...</p>
                  </div>
                </div>
              </div>
              
              {/* Map controls overlay */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
                <button 
                  className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-xs font-bold"
                  onClick={() => {
                    if (miniGoogleMapRef.current) {
                      const currentZoom = miniGoogleMapRef.current.getZoom();
                      miniGoogleMapRef.current.setZoom(currentZoom + 1);
                    }
                  }}
                >
                  +
                </button>
                <button 
                  className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 text-xs font-bold"
                  onClick={() => {
                    if (miniGoogleMapRef.current) {
                      const currentZoom = miniGoogleMapRef.current.getZoom();
                      miniGoogleMapRef.current.setZoom(currentZoom - 1);
                    }
                  }}
                >
                  −
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {apiaryFormData.location ? (
              <span className="text-green-600 font-medium">✓ Location selected</span>
            ) : (
              <span>Location required</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowApiaryModal(false);
                setApiaryFormData({
                  name: '',
                  number: '',
                  hiveCount: 0,
                  honeyCollected: 0,
                  location: null
                });
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={async () => {
                try {
                  setIsLoadingApiaries(true);
                  
                  console.log('=== CREATING APIARY ===');
                  console.log('Form data:', apiaryFormData);

                  const newApiary = {
                    name: apiaryFormData.name,
                    number: apiaryFormData.number,
                    hiveCount: apiaryFormData.hiveCount,
                    honeyCollected: apiaryFormData.honeyCollected,
                    location: apiaryFormData.location
                  };

                  await saveApiaryToDatabase(newApiary);

                  // Close modal and reset form
                  setShowApiaryModal(false);
                  setApiaryFormData({
                    name: '',
                    number: '',
                    hiveCount: 0,
                    honeyCollected: 0,
                    location: null
                  });

                  // Refresh apiaries list
                  await refreshApiariesFromDatabase();
                  
                  console.log('Apiary created successfully!');
                  
                } catch (error) {
                  console.error('Error saving apiary:', error);
                  
                  if (error.message.includes('already exists')) {
                    alert('An apiary with this number already exists. Please use a different number.');
                  } else if (error.message.includes('authentication') || error.message.includes('Authentication')) {
                    alert('Authentication failed. Please log in again.');
                  } else {
                    alert(`Failed to save apiary: ${error.message}`);
                  }
                } finally {
                  setIsLoadingApiaries(false);
                }
              }}
              disabled={!apiaryFormData.name || !apiaryFormData.number || !apiaryFormData.location || isLoadingApiaries}
              className={`px-8 py-2 rounded-lg text-white font-medium transition-all duration-200 flex items-center space-x-2 ${
                (apiaryFormData.name && apiaryFormData.number && apiaryFormData.location && !isLoadingApiaries)
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoadingApiaries ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>Create Apiary</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg max-w-md z-50">
          {notification.message}
        </div>
      )}
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

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white p-8 rounded-lg shadow flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-600">Loading batches...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h3 className="font-semibold">Error loading batches</h3>
          </div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      )}

      {/* Batch list table */}
      {!isLoading && !error && (
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
                      {typeof batch.totalKg === 'number' ? batch.totalKg.toLocaleString() : '0'}
                    </td>
                    <td 
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => toggleExpand(batch.id)}
                    >
                      {typeof batch.jarsProduced === 'number' ? batch.jarsProduced.toLocaleString() : '0'}
                    </td>
                    <td 
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => toggleExpand(batch.id)}
                    >
                      {batch.apiaries?.length || 0}
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

                          {notification.show && (
                            <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
                            {notification.message}
                         <button 
                            onClick={() => setNotification({ ...notification, show: false })}
                            className="ml-2 text-gray-300 hover:text-white"
                          >
      ×
                         </button>
                         </div>
                         )}
                     
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
                                <span className="font-medium">{typeof batch.totalKg === 'number' ? batch.totalKg.toLocaleString() : '0'} kg</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Jars Produced:</span>
                                <span className="font-medium">{typeof batch.jarsProduced === 'number' ? batch.jarsProduced.toLocaleString() : '0'}</span>
                                </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium ${batch.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {batch.status === 'completed' ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Apiaries list */}
<div className="bg-white p-4 rounded-lg shadow">
  <h3 className="text-sm font-semibold mb-2">Associated Apiaries</h3>
  {batch.apiaries && batch.apiaries.length > 0 ? (
    <div className="space-y-3">
      {batch.apiaries.map((apiary, index) => (
        <div key={index} className="border-b pb-2 last:border-b-0">
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
            <span className="text-gray-600">Honey collected:</span>
            <span className="font-medium">{apiary.kilosCollected} kg</span>
          </div>
          {apiary.latitude && apiary.longitude && (
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium flex items-center">
                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                {apiary.latitude.toFixed(4)}, {apiary.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-4 text-gray-500 italic">
      No apiaries associated with this batch
    </div>
  )}
</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredBatches.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-block p-3 rounded-full bg-gray-100 mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600">No batches found</h3>
              <p className="text-gray-500 mt-1">
                {batches.length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first batch to get started'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Token statistics */}
      <div className="bg-white p-4 rounded-lg shadow">
  <h2 className="text-lg font-semibold mb-4">Certification Tokens</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Token Status</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total tokens:</span>
          <span className="font-medium">{tokenStats.totalTokens}</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining tokens:</span>
          <span className="font-medium">{tokenStats.remainingTokens}</span>
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div
              style={{ width: `${(tokenStats.remainingTokens / tokenStats.totalTokens) * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-600 mb-2">Token Distribution</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[
              { name: 'Origin Only', value: tokenStats.originOnly, color: '#3182CE' },
              { name: 'Quality Only', value: tokenStats.qualityOnly, color: '#38A169' },
              { name: 'Both', value: tokenStats.bothCertifications, color: '#805AD5' },
            ]}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" name="Tokens" fill="#FBBF24">
              {[
                { name: 'Origin Only', value: tokenStats.originOnly, color: '#3182CE' },
                { name: 'Quality Only', value: tokenStats.qualityOnly, color: '#38A169' },
                { name: 'Both', value: tokenStats.bothCertifications, color: '#805AD5' },
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
</div>

      {/* Print notification dialog */}
      {showPrintNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center text-yellow-500 mb-4">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="font-semibold">Complete Batch Information</h3>
            </div>
            <p className="text-gray-600 mb-4">
              One or more of the selected batches have incomplete information. Would you like to complete them before printing?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPrintNotification(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
                Complete Batch Info
              </button>
            </div>
          </div>
        </div>
      )}

   {/* Complete batch form */}
{showCompleteForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Complete Batch Information</h3>
        <button
          onClick={() => setShowCompleteForm(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={handleCompleteBatch}>
        <div className="space-y-6">
          
          {/* Selected Batches Info */}
          <div>
            <p className="text-gray-600 mb-2">
              You are completing {selectedBatches.length} {selectedBatches.length === 1 ? 'batch' : 'batches'}:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedBatches.map(batchId => {
                const batch = batches.find(b => b.id === batchId);
                return (
                  <span key={batchId} className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                    {batch.batchNumber} ({batch.totalHoneyCollected} kg from batch record)
                  </span>
                );
              })}
            </div>
            
            {/* Total Available Honey from Apiaries */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Total Honey Available for Certification</h4>
              <p className="text-2xl font-bold text-blue-900">
                {getTotalHoneyFromApiaries()} kg
              </p>
              <p className="text-sm text-blue-600 mt-1">
                (Based on actual honey collected from all apiaries)
              </p>
            </div>
          </div>

          {/* Token Balance Display */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <Wallet className="h-6 w-6 text-yellow-600 mr-3" />
      <div>
        <h4 className="font-medium text-yellow-800">Your Token Balance</h4>
        <div className="flex items-center space-x-2">
          <p className="text-2xl font-bold text-yellow-900">{tokenBalance}</p>
          {getTotalJarsAcrossApiaries() > 0 && (
            <>
              <span className="text-gray-400">→</span>
              <p className="text-2xl font-bold text-green-600">
                {Math.max(0, tokenBalance - getTotalJarsAcrossApiaries())}
              </p>
              <span className="text-sm text-gray-500">(after completion)</span>
            </>
          )}
        </div>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm text-yellow-700">Tokens Needed: {getTotalJarsAcrossApiaries()}</p>
      <p className={`font-bold ${tokenBalance - getTotalJarsAcrossApiaries() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        Remaining: {tokenBalance - getTotalJarsAcrossApiaries()} tokens
      </p>
    </div>
  </div>
  <div className="flex justify-between items-center mt-3">
    <div className="text-sm text-yellow-700">
      Need more tokens? 
    </div>
    <button
      type="button"
      onClick={() => router.push('/buy-token')}
      className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center text-sm"
    >
      <PlusCircle className="h-4 w-4 mr-1" />
      Buy Tokens
    </button>
  </div>
  {tokenBalance - getTotalJarsAcrossApiaries() < 0 && (
    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
      <p className="text-red-700 text-sm">
        ⚠️ Insufficient tokens! You need {Math.abs(tokenBalance - getTotalJarsAcrossApiaries())} more tokens.
        <button
          type="button"
          onClick={() => router.push('/buy-token')}
          className="ml-2 underline hover:no-underline"
        >
          Buy tokens now
        </button>
      </p>
    </div>
  )}
</div>

          {/* Custom Jar Definition Section */}
          <div className="border rounded-md p-4 mb-4">
  <h4 className="font-medium mb-3">Define Jars for Each Apiary</h4>
  <p className="text-sm text-gray-600 mb-4">
    Define jars for each apiary individually based on their honey production.
  </p>

  {formData.apiaries.map((apiary, apiaryIndex) => (
  <div key={apiaryIndex} className="border rounded-md p-4 mb-6 bg-gray-50">
    <h5 className="font-medium mb-3 text-lg">
      {apiary.name} ({apiary.number})
      <span className="ml-2 text-sm font-normal text-blue-600">
        Available: {apiary.kilosCollected} kg
      </span>
    </h5>

    {/* Add New Jar Form */}
    <div className={`bg-white p-4 rounded-lg mb-4 ${isApiaryFullyAllocated(apiaryIndex) ? 'opacity-50' : ''}`}>
      <h6 className="font-medium mb-3">
        Add Jars for This Apiary
        {isApiaryFullyAllocated(apiaryIndex) && (
          <span className="ml-2 text-sm text-green-600 font-normal">
            ✓ All honey allocated
          </span>
        )}
      </h6>

      {!isApiaryFullyAllocated(apiaryIndex) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jar Size (grams)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={newJarForApiary[apiaryIndex]?.size || 0}
              onChange={(e) =>
                setNewJarForApiary({
                  ...newJarForApiary,
                  [apiaryIndex]: {
                    ...newJarForApiary[apiaryIndex],
                    size: parseInt(e.target.value) || 0,
                    quantity: newJarForApiary[apiaryIndex]?.quantity || 1,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 250, 400, 850"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max={Math.floor(
                getRemainingHoneyForApiary(apiaryIndex) * 1000 /
                  (newJarForApiary[apiaryIndex]?.size || 1)
              )}
              value={newJarForApiary[apiaryIndex]?.quantity || 1}
              onChange={(e) =>
                setNewJarForApiary({
                  ...newJarForApiary,
                  [apiaryIndex]: {
                    ...newJarForApiary[apiaryIndex],
                    size: newJarForApiary[apiaryIndex]?.size || 0,
                    quantity: parseInt(e.target.value) || 1,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="How many jars"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max:{' '}
              {Math.floor(
                getRemainingHoneyForApiary(apiaryIndex) * 1000 /
                  (newJarForApiary[apiaryIndex]?.size || 1)
              )}{' '}
              jars
            </p>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => addJarToApiary(apiaryIndex)}
              disabled={!newJarForApiary[apiaryIndex]?.size}
              className={`w-full px-4 py-2 rounded-md flex items-center justify-center ${
                newJarForApiary[apiaryIndex]?.size > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Jars
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">
              All honey from this apiary has been allocated to jars
            </p>
          </div>
          <p className="text-green-600 text-sm mt-1">
            Delete some jars if you want to create different jar configurations
          </p>
        </div>
      )}
    </div>

    {/* Jars list */}
    {getJarsForApiary(apiaryIndex).length > 0 && (
      <div className="space-y-3">
        <h6 className="font-medium">Defined Jars for This Apiary</h6>
        {getJarsForApiary(apiaryIndex).map((jar) => (
          <div key={jar.id} className="flex items-center justify-between p-3 bg-white border rounded-md">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">{jar.quantity}x {jar.size}g jars</span>
                <span className="text-gray-500 ml-2">
                  = {((jar.size * jar.quantity) / 1000).toFixed(2)} kg total
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeJarFromApiary(apiaryIndex, jar.id)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className={`p-3 rounded-lg ${isApiaryFullyAllocated(apiaryIndex) ? 'bg-green-50 border border-green-200' : 'bg-blue-50'}`}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Jars:</span>
              <span className="ml-2 font-bold">
                {getJarsForApiary(apiaryIndex).reduce((sum, jar) => sum + jar.quantity, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Weight:</span>
              <span className="ml-2 font-bold">
                {getJarsForApiary(apiaryIndex)
                  .reduce((sum, jar) => sum + (jar.size * jar.quantity) / 1000, 0)
                  .toFixed(2)}{' '}
                kg
              </span>
            </div>
            <div>
              <span className="text-gray-600">Remaining:</span>
              <span className={`ml-2 font-bold ${isApiaryFullyAllocated(apiaryIndex) ? 'text-green-600' : 'text-blue-600'}`}>
                {getRemainingHoneyForApiary(apiaryIndex).toFixed(2)} kg
                {isApiaryFullyAllocated(apiaryIndex) && (
                  <span className="ml-1 text-green-500">✓</span>
                )}
              </span>
            </div>
          </div>
          {isApiaryFullyAllocated(apiaryIndex) && (
            <div className="mt-2 text-center">
              <span className="text-green-700 text-sm font-medium">
                🎯 Perfect allocation! All honey from this apiary is assigned to jars.
              </span>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Empty placeholder if no jars defined */}
    {getJarsForApiary(apiaryIndex).length === 0 && !isApiaryFullyAllocated(apiaryIndex) && (
      <div
        className="border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50"
        onClick={() => {
          if (!newJarForApiary[apiaryIndex]) {
            setNewJarForApiary({
              ...newJarForApiary,
              [apiaryIndex]: { size: 250, quantity: 1 },
            });
          }
        }}
      >
        <PlusCircle className="h-6 w-6 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500">Click to add jars for this apiary</p>
      </div>
    )}
  </div>
))}


  {/* Overall Summary */}
  {Object.keys(apiaryJars).length > 0 && (
    <div className={`p-4 rounded-lg ${isAllHoneyAllocated() ? 'bg-green-50 border border-green-200' : 'bg-yellow-50'}`}>
    <div className="flex items-center justify-between mb-2">
      <h5 className="font-medium">Overall Summary</h5>
      {isAllHoneyAllocated() && (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <Check className="h-4 w-4 mr-1" />
          Complete Allocation
        </span>
      )}
    </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total Jars:</span>
          <span className="ml-2 font-bold">{getTotalJarsAcrossApiaries()}</span>
        </div>
        <div>
          <span className="text-gray-600">Total Weight:</span>
          <span className="ml-2 font-bold">
            {Object.values(apiaryJars).flat().reduce((sum, jar) => sum + (jar.size * jar.quantity / 1000), 0).toFixed(2)} kg
          </span>
        </div>
        <div>
          <span className="text-gray-600">Total Available:</span>
          <span className="ml-2 font-bold text-blue-600">
            {getTotalHoneyFromApiaries()} kg
          </span>
        </div>
        <div>
          <span className="text-gray-600">Tokens Needed:</span>
          <span className="ml-2 font-bold text-yellow-600">
            {getTotalJarsAcrossApiaries()} tokens
          </span>
        </div>
      </div>
    </div>
  )}
</div>
          {/* Certification Selection for Jars */}
{Object.keys(apiaryJars).length > 0 && (
  <div className="border rounded-md p-4 mb-4">
    <h4 className="font-medium mb-3">Select Certifications for Your Jars</h4>
    <p className="text-sm text-gray-600 mb-4">
      Choose which certifications you want for each jar type. Each jar requires 1 token regardless of certification type.
    </p>
    
    <div className="space-y-4">
      {Object.values(apiaryJars).flat().map((jar, index) => (
        <div key={jar.id} className="border rounded-md p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium">
              {jar.quantity}x {jar.size}g jars 
              <span className="text-sm text-gray-500 ml-2">
                ({((jar.size * jar.quantity) / 1000).toFixed(2)} kg total)
              </span>
            </h5>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Origin Certification */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`origin-${jar.id}`}
                checked={jarCertifications[jar.id]?.origin || false}
                onChange={(e) => {
                  const currentCertification = jarCertifications[jar.id] || {};
                  const updatedCertification: JarCertification = {
                    ...currentCertification,
                    origin: e.target.checked,
                    selectedType: getSelectedType({
                      ...currentCertification,
                      origin: e.target.checked
                    }) as 'origin' | 'quality' | 'both' | undefined
                  };
                  
                  setJarCertifications({
                    ...jarCertifications,
                    [jar.id]: updatedCertification
                  });
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
              />
              <label htmlFor={`origin-${jar.id}`} className="ml-2 text-sm">
                <span className="font-medium text-blue-600">Origin Certification</span>
                <br />
                <span className="text-xs text-gray-500">Certifies geographic origin</span>
              </label>
            </div>

            {/* Quality Certification */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`quality-${jar.id}`}
                checked={jarCertifications[jar.id]?.quality || false}
                onChange={(e) => {
                  const currentCertification = jarCertifications[jar.id] || {};
                  const updatedCertification: JarCertification = {
                    ...currentCertification,
                    quality: e.target.checked,
                    selectedType: getSelectedType({
                      ...currentCertification,
                      quality: e.target.checked
                    }) as 'origin' | 'quality' | 'both' | undefined
                  };
                  
                  // Remove the 'both' property if it exists to avoid type conflicts
                  if ('both' in updatedCertification) {
                    delete updatedCertification.both;
                  }
                  
                  setJarCertifications({
                    ...jarCertifications,
                    [jar.id]: updatedCertification
                  });
                }}
                className="h-4 w-4 text-green-600 focus:ring-green-500 rounded"
              />
              <label htmlFor={`quality-${jar.id}`} className="ml-2 text-sm">
                <span className="font-medium text-green-600">Quality Certification</span>
                <br />
                <span className="text-xs text-gray-500">Certifies quality standards</span>
              </label>
            </div>
          </div>

          {/* Show warning if no certification selected */}
          {!jarCertifications[jar.id]?.origin && !jarCertifications[jar.id]?.quality && (
            <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded-md">
              <p className="text-orange-700 text-sm">
                ⚠️ Please select at least one certification type for these jars.
              </p>
            </div>
          )}

                    {/* Show selected certifications */}
                    {(jarCertifications[jar.id]?.origin || jarCertifications[jar.id]?.quality) && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-blue-700 text-sm">
                          ✓ Selected: {[
                            jarCertifications[jar.id]?.origin && 'Origin',
                            jarCertifications[jar.id]?.quality && 'Quality'
                          ].filter(Boolean).join(' + ')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Certification Summary */}
              <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                <h5 className="font-medium mb-2">Certification Summary</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Origin Only:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {Object.values(jarCertifications).filter(cert => cert?.origin && !cert?.quality).length} jar types
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quality Only:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {Object.values(jarCertifications).filter(cert => cert?.quality && !cert?.origin).length} jar types
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Both Selected:</span>
                    <span className="ml-2 font-bold text-purple-600">
                      {Object.values(jarCertifications).filter(cert => cert?.origin && cert?.quality).length} jar types
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Tokens:</span>
                    <span className="ml-2 font-bold text-yellow-600">
                      {Object.values(apiaryJars).flat().reduce((sum, jar) => sum + jar.quantity, 0)} tokens
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Section - only show if jars are defined and certifications selected */}
          {Object.keys(apiaryJars).length > 0 && hasRequiredCertifications() && (
            <div className="border rounded-md p-4 mb-4">
              <h4 className="font-medium mb-3">Required Documents</h4>
              
              {/* Production Report Upload - for Origin certification */}
              {needsProductionReport() && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Report <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Required for Origin certification)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setFormData({
                        ...formData, 
                        productionReport: e.target.files[0]
                      })}
                      className="hidden"
                      id="production-report-upload"
                    />
                    <label 
                      htmlFor="production-report-upload" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 text-center">
                        {formData.productionReport 
                          ? `Selected: ${formData.productionReport.name}`
                          : 'Click to upload production report (PDF, DOC, DOCX, JPG, PNG)'
                        }
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Lab Report Upload - for Quality certification */}
              {needsLabReport() && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lab Report <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Required for Quality certification)</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setFormData({
                        ...formData, 
                        labReport: e.target.files[0]
                      })}
                      className="hidden"
                      id="lab-report-upload"
                    />
                    <label 
                      htmlFor="lab-report-upload" 
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 text-center">
                        {formData.labReport 
                          ? `Selected: ${formData.labReport.name}`
                          : 'Click to upload lab report (PDF, DOC, DOCX, JPG, PNG)'
                        }
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Apiaries Information - SIMPLIFIED VERSION */}
<div className="border rounded-md p-4 mb-4">
  <h4 className="font-medium mb-3">Apiaries Information</h4>
  <p className="text-sm text-gray-600 mb-4">
    Review the apiaries associated with the selected batches.
  </p>
  
  {formData.apiaries.length === 0 ? (
    <div className="text-center py-4 text-gray-500 italic">
      No apiaries associated with selected batches
    </div>
  ) : (
    <div className="space-y-6">
      {formData.apiaries.map((apiary, index) => {
        // Debug logs for each apiary
        console.log(`Apiary ${index} (${apiary.name}):`, apiary);
        console.log(`Latitude: ${apiary.latitude} (type: ${typeof apiary.latitude})`);
        console.log(`Longitude: ${apiary.longitude} (type: ${typeof apiary.longitude})`);
        console.log(`Latitude === 0:`, apiary.latitude === 0);
        console.log(`Longitude === 0:`, apiary.longitude === 0);
        console.log(`Latitude == null:`, apiary.latitude == null);
        console.log(`Longitude == null:`, apiary.longitude == null);
        console.log('---');
        
        return (
          <div key={index} className="border rounded-md p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-lg">
                {apiary.name} ({apiary.number})
                {apiary.batchNumber && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    From Batch: {apiary.batchNumber}
                  </span>
                )}
              </h5>
            </div>
            
            {/* Apiary Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Hives
                </span>
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900">
                  {apiary.hiveCount}
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Honey Collected (kg)
                </span>
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900 font-bold text-blue-600">
                  {apiary.kilosCollected}
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </span>
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900">
                  {apiary.latitude != null ? apiary.latitude.toFixed(4) : 'Not specified'}
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </span>
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900">
                  {apiary.longitude != null ? apiary.longitude.toFixed(4) : 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCompleteForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
  type="submit"
  disabled={!isFormValid()}
  className={`px-4 py-2 rounded-md flex items-center ${
    isFormValid()
      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  <Check className="h-4 w-4 mr-2" />
  Complete & Pay {tokenCalculation.tokensNeeded} Tokens
</button>
          </div>
        </div>
      </form>
    </div>
  </div>
)}

{/* Profile notification dialog */}
{showProfileNotification && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <div className="flex items-center text-blue-500 mb-4">
        <AlertCircle className="h-6 w-6 mr-2" />
        <h3 className="font-semibold">Complete Your Profile</h3>
      </div>
      <p className="text-gray-600 mb-4">
        To generate certificates, please complete your beekeeper profile. This information will be included in the certificates.
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowProfileNotification(false)}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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

{/* Profile form */}
{showProfileForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Complete Your Profile</h3>
        <button
          onClick={() => setShowProfileForm(false)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <form onSubmit={handleProfileSubmit}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beekeeper Passport ID
            </label>
            <input
              type="text"
              value={profileData.passportId}
              onChange={(e) => handleProfileChange('passportId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Passport Scan
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      onChange={handleFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, PDF up to 10MB
                </p>
              </div>
            </div>
            {profileData.passportScan && (
              <p className="mt-2 text-sm text-green-600">
                File uploaded: {profileData.passportScan.name}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowProfileForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Profile
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
)}

{/* Profile completed success message */}
{showProfileCompletedMessage && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <div className="flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Profile Completed!</h3>
        <p className="text-gray-600 mb-6">
          Your beekeeper profile has been completed successfully. You can now proceed with generating certificates.
        </p>
        <button
          onClick={() => {
            setShowProfileCompletedMessage(false);
            // Navigate to the completed batches page or back to the batch list
            navigateToBatchList();
          }}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 w-full"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
)}
    {/* Floating Action Menu - ADD THIS RIGHT AFTER CERTIFICATION ANALYTICS SECTION */}
          <div className="fixed bottom-6 right-6 z-50">
            {/* Background overlay when menu is open */}
            {isOpen && (
              <div 
                className="fixed inset-0 bg-black/10 backdrop-blur-sm -z-10"
                onClick={() => setIsOpen(false)}
              />
            )}
            
            {/* Menu Options */}
            <div className={`absolute bottom-20 right-0 space-y-3 transform transition-all duration-300 ease-out ${
              isOpen 
                ? 'translate-y-0 opacity-100 scale-100' 
                : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
            }`}>
              
              {/* Create Batch Option */}
              <div className="flex items-center space-x-3">
                <div className="bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border text-sm font-medium whitespace-nowrap">
                  Create New Batch
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => setShowBatchModal(true), 200);
                  }}
                  className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20"
                >
                  <Package className="h-6 w-6" />
                  <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
                </button>
              </div>
    
              {/* Create Apiary Option */}
              <div className="flex items-center space-x-3">
                <div className="bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border text-sm font-medium whitespace-nowrap">
                  Create New Apiary
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => setShowApiaryModal(true), 200);
                  }}
                  className="group relative bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20"
                >
                  <MapPin className="h-6 w-6" />
                  <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
                </button>
              </div>
            </div>
    
            {/* Main FAB Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`group relative bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transform transition-all duration-300 border-2 border-white/20 ${
                isOpen ? 'rotate-45 scale-110' : 'hover:scale-110'
              }`}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              
              {/* Icon */}
              <div className="relative z-10">
                {isOpen ? (
                  <X className="h-7 w-7 transition-transform duration-300" />
                ) : (
                  <Plus className="h-7 w-7 transition-transform duration-300" />
                )}
              </div>
    
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-100 transition-transform duration-200" />
              
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200">
                <div className="w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
              </div>
            </button>
    
            {/* Subtle pulsing ring when closed */}
            {!isOpen && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping pointer-events-none" />
            )}
          </div>
    </div>
  );
}