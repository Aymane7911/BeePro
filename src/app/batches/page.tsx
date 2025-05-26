'use client'

import React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, X, Search, ChevronDown, ChevronUp, Printer, PlusCircle, Check, AlertCircle, MapPin, Package, RefreshCw, Filter, ArrowLeft, Upload, Trash2, AlertTriangle, CheckCircle, Wallet, Plus } from 'lucide-react';
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
  kilosCollected: number;
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
}

interface JarCertification {
  origin?: boolean;
  quality?: boolean;
  both?: boolean;
  selectedType?: 'origin' | 'quality' | 'both';
  
}

interface JarCertifications {
  [key: number]: JarCertification;
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
  const [formData, setFormData] = useState({
    certificationType:'',
     productionReport: null as File | null,
     labReport: null as File | null,
    apiaries: [{
      batchId:'',
      batchNumber:'',
      name: '',
      number: '',
      hiveCount: 0,
      latitude: 0,
      longitude: 0,
      kilosCollected: 0,
    }]
  });

  const [apiariesLocation, setApiariesLocation] = useState({
  latitude: 0,
  longitude: 0
});
  const updateApiaryHoney = (batchId: string, apiaryNumber: string, value: number) => {
  setApiaryHoneyValues(prev => ({
    ...prev,
    [`${batchId}-${apiaryNumber}`]: value
  }));
};



// Add this useEffect after where you define the showCompleteForm state
useEffect(() => {
  if (showCompleteForm && selectedBatches.length === 1) {
    // Find the selected batch
    const selectedBatch = batches.find(b => b.id === selectedBatches[0]);
    
    // If the batch has apiaries, use them to initialize the form
    if (selectedBatch && selectedBatch.apiaries && selectedBatch.apiaries.length > 0) {
      setFormData(prevState => ({
        ...prevState,
        apiaries: selectedBatch.apiaries.map(apiary => ({
          batchId: apiary.batchId,
          batchNumber: apiary.batchNumber,
          name: apiary.name,
          number: apiary.number,
          hiveCount: apiary.hiveCount,
          kilosCollected: apiary.kilosCollected || 0,
          latitude: apiary.latitude,
          longitude: apiary.longitude
        }))
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
// Google Maps initialization useEffect
useEffect(() => {
  if (!showCompleteForm) return;

  // Load Google Maps API script if it's not already loaded
  if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initMaps;
    document.head.appendChild(script);
  } else if (window.google && window.google.maps) {
    initMaps();
  }
}, [formData.apiaries.length, showCompleteForm]);

// Function to initialize maps
function initMaps() {
  mapsLoaded.current = true;
  
  // Initialize maps for individual apiaries (existing functionality)
  formData.apiaries.forEach((apiary, index) => {
    const mapElement = document.getElementById(`map-${index}`);
    if (!mapElement) return;
                 
    const position = { lat: apiary.latitude || 0, lng: apiary.longitude || 0 };
    const map = new window.google.maps.Map(mapElement, {
      center: position,
      zoom: 10,
    });
                 
    let marker = new window.google.maps.Marker({
      position: position,
      map: map,
      draggable: true,
      title: apiary.name || `Apiary ${index + 1}`,
    });
                 
    // FIXED: Update coordinates when marker is dragged
    window.google.maps.event.addListener(marker, 'dragend', function() {
      const position = marker.getPosition();
      if (!position) return; // Safety check
      
      setFormData(prevFormData => {
        const newApiaries = prevFormData.apiaries.map((apiary, apiaryIndex) => {
          if (apiaryIndex === index) {
            return {
              ...apiary, // Preserve ALL existing properties
              latitude: position.lat(),
              longitude: position.lng()
            };
          }
          return apiary; // Return unchanged apiary
        });
        
        return {
          ...prevFormData, // Preserve all form data
          apiaries: newApiaries
        };
      });
    });
                 
    // FIXED: Click on map to place marker
    window.google.maps.event.addListener(map, 'click', function(event: google.maps.MapMouseEvent) {
      const latLng = event.latLng;
      if (!latLng) return; // Safety check
      
      marker.setPosition(latLng);
      
      setFormData(prevFormData => {
        const newApiaries = prevFormData.apiaries.map((apiary, apiaryIndex) => {
          if (apiaryIndex === index) {
            return {
              ...apiary, // Preserve ALL existing properties
              latitude: latLng.lat(),
              longitude: latLng.lng()
            };
          }
          return apiary; // Return unchanged apiary
        });
        
        return {
          ...prevFormData, // Preserve all form data
          apiaries: newApiaries
        };
      });
    });
                 
    mapRefs.current[index] = { map, marker };
  });

  // FIXED: Initialize individual maps for each apiary in complete batch form
  formData.apiaries.forEach((apiary, index) => {
    const apiaryLocationMapElement = document.getElementById(`apiary-location-map-${index}`);
    if (apiaryLocationMapElement && showCompleteForm) {
      const position = {
        lat: apiary.latitude || 0,
        lng: apiary.longitude || 0
      };
             
      const map = new window.google.maps.Map(apiaryLocationMapElement, {
        center: position,
        zoom: 12,
      });
             
      let marker = new window.google.maps.Marker({
        position: position,
        map: map,
        draggable: true,
        title: `${apiary.name} Certification Location`,
      });
             
      // FIXED: Update coordinates when marker is dragged
      window.google.maps.event.addListener(marker, 'dragend', function () {
        const position = marker.getPosition();
        if (!position) {
          console.warn('Marker position is null.');
          return;
        }
        
        setFormData(prevFormData => {
          const newApiaries = prevFormData.apiaries.map((apiary, apiaryIndex) => {
            if (apiaryIndex === index) {
              return {
                ...apiary, // Preserve ALL existing properties
                latitude: position.lat(),
                longitude: position.lng()
              };
            }
            return apiary; // Return unchanged apiary
          });
          
          return {
            ...prevFormData, // Preserve all form data
            apiaries: newApiaries
          };
        });
      });
              
      // FIXED: Click on map to place marker - THIS WAS THE MAIN ISSUE
      window.google.maps.event.addListener(map, 'click', function(event: google.maps.MapMouseEvent) {
        const latLng = event.latLng;
        if (!latLng) {
          console.warn('Click event latLng is null.');
          return;
        }

        marker.setPosition(latLng);

        setFormData(prevFormData => {
          const newApiaries = prevFormData.apiaries.map((apiary, apiaryIndex) => {
            if (apiaryIndex === index) {
              return {
                ...apiary, // Preserve ALL existing properties
                latitude: latLng.lat(),
                longitude: latLng.lng()
              };
            }
            return apiary; // Return unchanged apiary
          });

          return {
            ...prevFormData, // Preserve all form data
            apiaries: newApiaries
          };
        });
        
        console.log(`Updated apiary ${index} coordinates:`, {
          lat: latLng.lat(),
          lng: latLng.lng()
        });
      });
             
      // Store references globally for access from input handlers
      window[`apiariesMap_${index}`] = map;
      window[`apiariesMarker_${index}`] = marker;
    }
  });
}

// Function to use current location
function handleUseCurrentLocation(index) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleApiaryChange(index, 'latitude', latitude);
        handleApiaryChange(index, 'longitude', longitude);
        
        // Update map if available
        if (mapsLoaded.current && mapRefs.current[index]) {
          const position = { lat: latitude, lng: longitude };
          mapRefs.current[index].map.setCenter(position);
          mapRefs.current[index].marker.setPosition(position);
        }
      },
      (error) => {
        setNotification({
          show: true,
          message: `Error getting location: ${error.message}`,
          type: 'error'
        });
      }
    );
  } else {
    setNotification({
      show: true,
      message: "Geolocation is not supported by this browser.",
      type: 'error'
    });
  }
}


// In your main component


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
          batchId:'',
          batchNumber:'',
          name: '',
          number: '',
          hiveCount: 0,
          kilosCollected: 0,
          latitude: 0,
          longitude: 0
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
    setTokenBalance(prevBalance => prevBalance - tokensUsed);
  if (!formData.certificationType) {
    alert('Please select a certification type');
    return;

  }

  // Validate required files based on certification type
  const needsProductionReport = formData.certificationType === 'origin' || formData.certificationType === 'both';
  const needsLabReport = formData.certificationType === 'quality' || formData.certificationType === 'both';

  if (needsProductionReport && !formData.productionReport) {
    alert('Production report is required for this certification type');
    return;
  }

  if (needsLabReport && !formData.labReport) {
    alert('Lab report is required for this certification type');
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

    // Process each batch individually
    for (const batchId of selectedBatches) {
      // Prepare batch-specific data
      const batchData = {
        batchId,
        updatedFields: {
          status: 'Completed',
          certificationType: formData.certificationType,
          certificationDate: new Date().toISOString().split('T')[0],
          // Add expiry date (e.g., 2 years from certification)
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completedChecks: 4,
          totalChecks: 4
        },
        apiaries: formData.apiaries.filter(apiary => apiary.batchId === batchId || !apiary.batchId).map(apiary => {
          const storedValue = apiaryHoneyValues[`${batchId}-${apiary.number}`];
          return {
            name: apiary.name,
            number: apiary.number,
            hiveCount: apiary.hiveCount,
            latitude: apiary.latitude,
            longitude: apiary.longitude,
            kilosCollected: storedValue !== undefined ? storedValue : apiary.kilosCollected
          };
        })
      };

      // Create FormData for this specific batch
      const batchFormData = new FormData();
      batchFormData.append('data', JSON.stringify(batchData));
      
      if (formData.productionReport) {
        batchFormData.append('productionReport', formData.productionReport);
      }
      
      if (formData.labReport) {
        batchFormData.append('labReport', formData.labReport);
      }

      // Update the batch
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

    // ✅ Update local state with new apiary values
    const updatedBatches: Batch[] = batches.map(batch => {
  if (selectedBatches.includes(batch.id) && batch.apiaries && batch.apiaries.length > 0) {
    return {
      ...batch,
      status: 'completed' as const, // Type assertion to match expected status type
      certificationType: formData.certificationType,
      apiaries: batch.apiaries.map(apiary => {
        const storedValue = apiaryHoneyValues[`${batch.id}-${apiary.number}`];
        return {
          ...apiary,
          kilosCollected: storedValue !== undefined ? storedValue : apiary.kilosCollected
        };
      })
    } as Batch; // Explicit type assertion
  }
  return batch;
});

setBatches(updatedBatches);
// Remove duplicate setBatches call
setShowCompleteForm(false);
setSelectedBatches([]);
setFormData({
  certificationType: '',
  productionReport: null,
  labReport: null,
  apiaries: []
});

    // ✅ Success notification
    setNotification({
      show: true,
      message: "Batch information completed successfully!",
      type: 'success'
    });

    // ✅ Open profile prompt
    setTimeout(() => {
      setShowProfileNotification(true);
    }, 500);

    // Refresh the batches list
    //fetchBatches();

  } catch (error) {
    console.error('Error completing batches:', error);
    setNotification({
      show: true,
      message: error.message,
      type: 'error'
    });
  } finally {
    setIsLoading(false);
  }
};



  // Handle adding a new apiary to the form
  const addApiary = () => {
    setFormData({
      ...formData,
      apiaries: [
        ...formData.apiaries,
        {
          batchNumber:'',
          batchId:'',
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

  const getTotalHoneyFromApiaries = () => {
  return formData.apiaries.reduce((total, apiary) => total + (apiary.kilosCollected || 0), 0);
};

  useEffect(() => {
  const totalWeight = (jarSizeDistribution.jar250g * 0.25) + 
                     (jarSizeDistribution.jar400g * 0.4) + 
                     (jarSizeDistribution.jar600g * 0.6);
  
  const totalJars = jarSizeDistribution.jar250g + jarSizeDistribution.jar400g + jarSizeDistribution.jar600g;
  
}, [jarSizeDistribution, tokenBalance, certificationAmounts]);
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
  const handleApiaryChange = (
  index: number, 
  field: 'hiveCount' | 'kilosCollected' | 'latitude' | 'longitude' | string, 
  value: string | number
) => {
    const newApiaries = [...formData.apiaries];
    
    // For numeric fields, handle empty values properly
    if (['hiveCount', 'kilosCollected', 'latitude', 'longitude'].includes(field)) {
      // Convert to number if value exists, otherwise use 0 or empty string
      // This prevents NaN values
      (newApiaries[index] as any)[field] = value === '' ? (field === 'kilosCollected' || field === 'hiveCount' ? 0 : '') : Number(value);
    } else {
     (newApiaries[index] as any)[field] = value;
    }
    
    setFormData({
      ...formData,
      apiaries: newApiaries
    });
  };

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
const [newJar, setNewJar] = useState<Omit<CustomJar, 'id'>>({
  size: 0,
  quantity: 1
});
const [customJars, setCustomJars] = useState<CustomJar[]>([]);
const [jarCertifications, setJarCertifications] = useState<JarCertifications>({});

// Add these helper functions
const hasRequiredCertifications = () => {
  return customJars.every(jar => jarCertifications[jar.id]?.selectedType);
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
  // Calculate tokens needed based on custom jars (1 token per jar)
  const tokensNeeded = customJars.reduce((sum, jar) => sum + jar.quantity, 0);
  const remaining = tokenBalance - tokensNeeded;
  
  // Calculate total jar weight in kg
  const totalJarWeight = customJars.reduce((sum, jar) => sum + (jar.size * jar.quantity / 1000), 0);
  
  return {
    tokensNeeded,
    remaining,
    totalJarWeight,
    isValid: tokensNeeded > 0,
    hasExceededJars: totalJarWeight > getTotalHoneyFromApiaries()
  };
}, [customJars, tokenBalance, getTotalHoneyFromApiaries]);

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
    onClick={handleDelete}
    disabled={selectedBatches.length === 0}
    className={`flex items-center px-4 py-2 rounded ${
      selectedBatches.length === 0 
        ? 'bg-gray-300 cursor-not-allowed' 
        : 'bg-red-600 hover:bg-red-700 text-white'
    }`}
  >
    <Trash2 className="h-4 w-4 mr-2" />
    Delete {selectedBatches.length > 0 ? `(${selectedBatches.length})` : ''}
  </button>

  {/* Delete confirmation dialog */}
{showDeleteConfirmation && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <div className="flex items-center text-red-500 mb-4">
        <AlertTriangle className="h-6 w-6 mr-2" />
        <h3 className="font-semibold">Delete Confirmation</h3>
      </div>
      {isDeleting ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Deleting batches...</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete {selectedBatches.length} {selectedBatches.length === 1 ? 'batch' : 'batches'}? This action cannot be undone.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  All associated apiaries and certification data will also be deleted.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 mb-4">
            <p className="text-sm text-gray-600 mb-2">The following batches will be deleted:</p>
            <div className="flex flex-wrap gap-2">
              {selectedBatches.map(batchId => {
                const batch = batches.find(b => b.id === batchId);
                return batch ? (
                  <span key={batchId} className="inline-flex px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                    {batch.batchNumber}
                  </span>
                ) : null;
              })}
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteConfirmation(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
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
                  <p className="text-2xl font-bold text-yellow-900">{tokenBalance} tokens</p>
                </div>
              </div>
              <div className="text-right">
  <p className="text-sm text-yellow-700">Tokens Needed: {tokenCalculation.tokensNeeded}</p>
  <p className={`font-bold ${tokenCalculation.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
    Remaining: {tokenCalculation.remaining} tokens
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
            {tokenCalculation.remaining < 0 && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-700 text-sm">
                  ⚠️ Insufficient tokens! You need {Math.abs(tokenCalculation.remaining)} more tokens.
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
            <h4 className="font-medium mb-3">Define Your Jars</h4>
            <p className="text-sm text-gray-600 mb-4">
              Define the jars you want to certify. You can create any jar size you want.
              <br />
              <strong>Available honey: {getTotalHoneyFromApiaries()} kg</strong>
            </p>

            {/* Add New Jar Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="font-medium mb-3">Add New Jar</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jar Size (grams)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newJar.size}
                    onChange={(e) => setNewJar({...newJar, size: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 250, 400, 850"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newJar.quantity}
                    onChange={(e) => setNewJar({...newJar, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How many jars"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (newJar.size > 0 && newJar.quantity > 0) {
                        const totalWeightOfNewJars = (newJar.size * newJar.quantity) / 1000; // Convert to kg
                        const currentTotalWeight = customJars.reduce((sum, jar) => sum + (jar.size * jar.quantity / 1000), 0);
                        
                        if (currentTotalWeight + totalWeightOfNewJars <= getTotalHoneyFromApiaries()) {
                          setCustomJars([...customJars, {...newJar, id: Date.now()}]);
                          setNewJar({size: 0, quantity: 1});
                        } else {
                          alert(`Cannot add jars. Total weight would exceed available honey (${getTotalHoneyFromApiaries()} kg)`);
                        }
                      }
                    }}
                    disabled={newJar.size === 0}
                    className={`w-full px-4 py-2 rounded-md flex items-center justify-center ${
                      newJar.size > 0 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Jars
                  </button>
                </div>
              </div>
            </div>

            {/* Display Current Jars */}
            {customJars.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium">Your Defined Jars</h5>
                {customJars.map((jar, index) => (
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
                      onClick={() => {
                        setCustomJars(customJars.filter(j => j.id !== jar.id));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {/* Total Summary */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Jars:</span>
                      <span className="ml-2 font-bold">{customJars.reduce((sum, jar) => sum + jar.quantity, 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Weight:</span>
                      <span className="ml-2 font-bold">
                        {(customJars.reduce((sum, jar) => sum + (jar.size * jar.quantity / 1000), 0)).toFixed(2)} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining Honey:</span>
                      <span className="ml-2 font-bold text-green-600">
                        {(getTotalHoneyFromApiaries() - customJars.reduce((sum, jar) => sum + (jar.size * jar.quantity / 1000), 0)).toFixed(2)} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tokens Needed:</span>
                      <span className="ml-2 font-bold text-yellow-600">
                        {customJars.reduce((sum, jar) => sum + jar.quantity, 0)} tokens
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Certification Selection for Jars */}
          {customJars.length > 0 && (
            <div className="border rounded-md p-4 mb-4">
              <h4 className="font-medium mb-3">Select Certifications for Your Jars</h4>
              <p className="text-sm text-gray-600 mb-4">
                Choose which certifications you want for each jar type. Each jar requires 1 token regardless of certification type.
              </p>
              
              <div className="space-y-4">
                {customJars.map((jar, index) => (
                  <div key={jar.id} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium">
                        {jar.quantity}x {jar.size}g jars 
                        <span className="text-sm text-gray-500 ml-2">
                          ({((jar.size * jar.quantity) / 1000).toFixed(2)} kg total)
                        </span>
                      </h5>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Origin Certification */}
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`certification-${jar.id}`}
                          id={`origin-${jar.id}`}
                          value="origin"
                          checked={jarCertifications[jar.id]?.selectedType === 'origin'}
                          onChange={(e) => {
                            setJarCertifications({
                              ...jarCertifications,
                              [jar.id]: {
                                selectedType: 'origin',
                                origin: true,
                                quality: false,
                                both: false
                              }
                            });
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
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
                          type="radio"
                          name={`certification-${jar.id}`}
                          id={`quality-${jar.id}`}
                          value="quality"
                          checked={jarCertifications[jar.id]?.selectedType === 'quality'}
                          onChange={(e) => {
                            setJarCertifications({
                              ...jarCertifications,
                              [jar.id]: {
                                selectedType: 'quality',
                                origin: false,
                                quality: true,
                                both: false
                              }
                            });
                          }}
                          className="h-4 w-4 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor={`quality-${jar.id}`} className="ml-2 text-sm">
                          <span className="font-medium text-green-600">Quality Certification</span>
                          <br />
                          <span className="text-xs text-gray-500">Certifies quality standards</span>
                        </label>
                      </div>

                      {/* Both Certifications */}
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`certification-${jar.id}`}
                          id={`both-${jar.id}`}
                          value="both"
                          checked={jarCertifications[jar.id]?.selectedType === 'both'}
                          onChange={(e) => {
                            setJarCertifications({
                              ...jarCertifications,
                              [jar.id]: {
                                selectedType: 'both',
                                origin: false,
                                quality: false,
                                both: true
                              }
                            });
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor={`both-${jar.id}`} className="ml-2 text-sm">
                          <span className="font-medium text-purple-600">Both Certifications</span>
                          <br />
                          <span className="text-xs text-gray-500">Origin & Quality together</span>
                        </label>
                      </div>
                    </div>

                    {/* Show warning if no certification selected */}
                    {!jarCertifications[jar.id]?.selectedType && (
                      <div className="mt-3 p-2 bg-orange-100 border border-orange-300 rounded-md">
                        <p className="text-orange-700 text-sm">
                          ⚠️ Please select a certification type for these jars.
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
                    <span className="text-gray-600">Origin Certifications:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {Object.values(jarCertifications).filter(cert => cert?.origin).length} jar types
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quality Certifications:</span>
                    <span className="ml-2 font-bold text-green-600">
                      {Object.values(jarCertifications).filter(cert => cert?.quality).length} jar types
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Both Certifications:</span>
                    <span className="ml-2 font-bold text-purple-600">
                      {Object.values(jarCertifications).filter(cert => cert?.both).length} jar types
                    </span>
                  </div>
                  <div>
  <span className="text-gray-600">Total Tokens:</span>
  <span className="ml-2 font-bold text-yellow-600">
    {customJars.reduce((sum, jar) => sum + jar.quantity, 0)} tokens
  </span>
</div>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Section - only show if jars are defined and certifications selected */}
          {customJars.length > 0 && hasRequiredCertifications() && (
            <div className="border rounded-md p-4 mb-4">
              <h4 className="font-medium mb-3">Required Documents</h4>
              
              {/* Production Report Upload - for Origin or Both */}
              {needsProductionReport() && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Report <span className="text-red-500">*</span>
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

              {/* Lab Report Upload - for Quality or Both */}
              {needsLabReport() && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lab Report <span className="text-red-500">*</span>
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

          {/* Apiaries Information and Location Selection */}
          <div className="border rounded-md p-4 mb-4">
            <h4 className="font-medium mb-3">Apiaries Information & Locations</h4>
            <p className="text-sm text-gray-600 mb-4">
              Review the apiaries associated with the selected batches and set their individual locations.
            </p>
            
            {formData.apiaries.length === 0 ? (
              <div className="text-center py-4 text-gray-500 italic">
                No apiaries associated with selected batches
              </div>
            ) : (
              <div className="space-y-6">
                {formData.apiaries.map((apiary, index) => (
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
                    
                    {/* Apiary Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                          Original Location (Reference)
                        </span>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900 text-sm">
                          {apiary.latitude != null && apiary.longitude != null
                            ? `${apiary.latitude.toFixed(4)}, ${apiary.longitude.toFixed(4)}`
                            : 'Not specified'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Individual Location Setting */}
                    <div className="border-t pt-4">
                      <h6 className="font-medium mb-3 text-gray-800">Set Location for This Apiary</h6>
                      
                      {/* Map Container */}
                      <div className="mb-4">
                        <div className="border rounded-md overflow-hidden">
                          <div 
                            id={`apiary-location-map-${index}`} 
                            className="h-48 w-full bg-gray-100 flex items-center justify-center"
                          >
                            <p className="text-gray-500">Map will load here</p>
                          </div>
                        </div>
                      </div>

                      {/* Coordinates Input */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Latitude <span className="text-red-500">*</span>
                          </label>
                          <div className="flex">
                            <input
                              type="number"
                              step="0.0001"
                              value={apiary.latitude || ''}
                              onChange={(e) => {
                                const newApiaries = [...formData.apiaries];
                                newApiaries[index] = {
                                  ...newApiaries[index],
                                  latitude: parseFloat(e.target.value) || 0
                                };
                                setFormData({
                                  ...formData,
                                  apiaries: newApiaries
                                });
                                
                                // Update map marker if map is loaded
                                if (window[`apiariesMap_${index}`] && window[`apiariesMarker_${index}`] && newApiaries[index].longitude) {
                                  const lat = parseFloat(e.target.value);
                                  const lng = newApiaries[index].longitude;
                                  if (!isNaN(lat) && !isNaN(lng)) {
                                    const newPos = { lat, lng };
                                    window[`apiariesMarker_${index}`].setPosition(newPos);
                                    window[`apiariesMap_${index}`].setCenter(newPos);
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                              placeholder="Enter latitude"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (navigator.geolocation) {
                                  navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                      const lat = position.coords.latitude;
                                      const lng = position.coords.longitude;
                                      
                                      const newApiaries = formData.apiaries.map((apiary, apiaryIndex) => {
                                        if (apiaryIndex === index) {
                                          return {
                                            ...apiary,
                                            latitude: lat,
                                            longitude: lng
                                          };
                                        }
                                        return apiary;
                                      });
                                      
                                      setFormData({
                                        ...formData,
                                        apiaries: newApiaries
                                      });
                                      
                                      // Update map if loaded
                                      if (window[`apiariesMap_${index}`] && window[`apiariesMarker_${index}`]) {
                                        const newPos = { lat, lng };
                                        window[`apiariesMarker_${index}`].setPosition(newPos);
                                        window[`apiariesMap_${index}`].setCenter(newPos);
                                      }
                                    },
                                    (error) => {
                                      console.error('Error getting location:', error);
                                      alert('Unable to get current location. Please enter coordinates manually.');
                                    }
                                  );
                                } else {
                                  alert('Geolocation is not supported by this browser.');
                                }
                              }}
                              className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                              title="Use current location"
                            >
                              <MapPin className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Longitude <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={apiary.longitude || ''}
                            onChange={(e) => {
                              const newApiaries = formData.apiaries.map((apiary, apiaryIndex) => {
                                if (apiaryIndex === index) {
                                  return {
                                    ...apiary,
                                    longitude: parseFloat(e.target.value) || 0
                                  };
                                }
                                return apiary;
                              });

                              setFormData({
                                ...formData,
                                apiaries: newApiaries
                              });

                              // Update map marker if map is loaded
                              if (window[`apiariesMap_${index}`] && window[`apiariesMarker_${index}`] && newApiaries[index].latitude) {
                                const lat = newApiaries[index].latitude;
                                const lng = parseFloat(e.target.value);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                  const newPos = { lat, lng };
                                  window[`apiariesMarker_${index}`].setPosition(newPos);
                                  window[`apiariesMap_${index}`].setCenter(newPos);
                                }
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="Enter longitude"
                            required
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Click on the map to set the location for this apiary or use the "Use current location" button
                      </p>
                      
                      {/* Display current coordinates if available */}
                      {apiary.latitude && apiary.longitude && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-800">
                            <strong>Current Location:</strong> {apiary.latitude.toFixed(4)}, {apiary.longitude.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
              disabled={
                calculateTotalHoneyToCertify(certificationAmounts) === 0 ||
                tokenCalculation.remaining < 0 ||
                !tokenCalculation.isValid ||
                tokenCalculation.hasExceededJars ||
                calculateTotalHoneyToCertify(certificationAmounts) > getTotalHoneyFromApiaries() ||
                ((certificationAmounts.origin > 0 || certificationAmounts.both > 0) && !formData.productionReport) ||
                ((certificationAmounts.quality > 0 || certificationAmounts.both > 0) && !formData.labReport)
              }
              className={`px-4 py-2 rounded-md flex items-center ${
                calculateTotalHoneyToCertify(certificationAmounts) > 0 &&
                tokenCalculation.remaining >= 0 &&
                tokenCalculation.isValid &&
                !tokenCalculation.hasExceededJars &&
                calculateTotalHoneyToCertify(certificationAmounts) <= getTotalHoneyFromApiaries() &&
                ((certificationAmounts.origin === 0 && certificationAmounts.both === 0) || formData.productionReport) &&
                ((certificationAmounts.quality === 0 && certificationAmounts.both === 0) || formData.labReport)
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
    </div>
  );
}