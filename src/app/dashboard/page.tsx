'use client'

import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Layers, Database, Tag, Package, RefreshCw, Menu, X, Home, Settings, Users, Activity, HelpCircle, Wallet, PlusCircle, MapPin, CheckCircle, Trash2, Globe, FileText, AlertCircle, Sparkles, LogOut, Plus, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

// Define your interfaces here, right after imports
interface TokenStats {
  originOnly: number;
  qualityOnly: number;
  bothCertifications: number;
  remainingTokens: number;
  totalTokens: number;
}

interface SelectedApiary extends Apiary {
  kilosCollected: number; // Override to ensure this is always present
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

interface Apiary {
  id: string;
  name: string;
  number: string;
  hiveCount: number;
  honeyCollected: number,
  location: ApiaryLocation;
  createdAt?: string;
}

interface LocationCoordinates {
  lat: number;
  lng: number;
}


interface ClickPosition {
  x: number;
  y: number;
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
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapsLinkInput, setMapsLinkInput] = useState('');
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const miniMapRef = useRef<HTMLDivElement | null>(null); 
  const miniGoogleMapRef = useRef<google.maps.Map | null>(null);
  const googleMapsApiKey = "AIzaSyBhRpOpnKWIXGMOTsdVoGKAnAC94Q0Sgxc"; 
  const [savedApiaryLocations, setSavedApiaryLocations] = useState<ApiaryLocation[]>([]);
  const [showApiaryModal, setShowApiaryModal] = useState(false);
  const [availableApiaries, setAvailableApiaries] = useState<Apiary[]>([]); // List of all created apiaries
  const [isLoadingApiaries, setIsLoadingApiaries] = useState(false);
  const [selectedApiaries, setSelectedApiaries] = useState<SelectedApiary[]>([]); // Selected apiaries for current batch
  const [locations, setLocations] = useState<ApiaryLocation[]>([]);
  // Add these state variables to your component
  const apiaryMarkers = useRef<google.maps.Marker[]>([]);
  const [selectedApiary, setSelectedApiary] = useState<Apiary | null>(null);
  const [selectedDropdownApiary, setSelectedDropdownApiary] = useState('');
  const [showApiaryInfo, setShowApiaryInfo] = useState(false);
  const [apiaryInfoPosition, setApiaryInfoPosition] = useState({ x: 0, y: 0 });
  const tempMarker = useRef<google.maps.Marker | null>(null);
  const [apiaryFormData, setApiaryFormData] = useState<ApiaryFormData>({
  name: '',
  number: '',
  hiveCount: 0,
  honeyCollected: 0,
  location: null
});
const [isLoggingOut, setIsLoggingOut] = useState(false);
const [isOpen, setIsOpen] = useState(false);
  
// Function to create authenticated API headers
  const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  const headers: { [key: string]: string } = {
  'Content-Type': 'application/json',
};


  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};
  // 1. Add clickPosition state to track where user clicked for bubble positioning
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [batchFormData, setBatchFormData] = useState({
    apiaries: [
      {
        name: '',
        number: '',
        hiveCount: 0,
        kilosCollected: 0,
        locationId: ''
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


  {/* Add this function to extract coordinates from Google Maps links */}

{/* Add this function to handle manual coordinate input */}
const parseManualCoordinates = (input) => {
  try {
    // Clean the input and try different formats
    const cleanInput = input.trim().replace(/[^\d.,-]/g, '');
    
    // Try different coordinate formats
    const formats = [
      // Format: "lat, lng" or "lat,lng"
      /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
      // Format: "lat lng" (space separated)
      /^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/
    ];

    for (const format of formats) {
      const match = cleanInput.match(format);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        
        // Validate coordinates
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing manual coordinates:', error);
    return null;
  }
};

{/* Add this function to extract coordinates from Google Maps links */}
const extractCoordinatesFromMapsLink = async (url) => {
  try {
    // First check if the input looks like manual coordinates
    const manualCoords = parseManualCoordinates(url);
    if (manualCoords) {
      return manualCoords;
    }

    let workingUrl = url;
    
    // Handle different Google Maps URL formats
    const patterns = [
      // Format: https://www.google.com/maps/@lat,lng,zoom
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // Format: https://maps.google.com/?q=lat,lng
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // Format: https://www.google.com/maps/place/@lat,lng
      /place\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // Format: https://goo.gl/maps or similar with coordinates (encoded format)
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
      // Format: Standard coordinates in URL
      /(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // Format: Alternative coordinate format
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // Format: Another common format
      /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // Format: Plus codes and other formats
      /data=.*?3d(-?\d+\.?\d*).*?4d(-?\d+\.?\d*)/
    ];

    // Try to extract from the original URL first
    for (const pattern of patterns) {
      const match = workingUrl.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        
        // Validate coordinates
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          console.log('Successfully extracted coordinates:', { lat, lng });
          return { lat, lng };
        }
      }
    }
    
    // For shortened URLs, try opening in a new window approach (user-initiated)
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      console.log('Detected shortened URL - cannot automatically expand due to CORS restrictions');
      return 'SHORTENED_URL';
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing maps link:', error);
    return null;
  }
};

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

 

  function getAuthToken() {
  // Replace this with however you store your JWT token
  // Could be localStorage, sessionStorage, cookies, context, etc.
  return localStorage.getItem('authToken') || localStorage.getItem('token');
}

// Function to make authenticated API requests
async function makeAuthenticatedRequest(url, options = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

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
// You should also add a useEffect to load apiaries when the component mounts:
useEffect(() => {
  refreshApiariesFromDatabase();
}, []);
  const createApiary = async () => {
  if (!apiaryFormData.name || !apiaryFormData.number || !apiaryFormData.location) {
    setNotification({
      show: true,
      message: 'Please fill in all required fields and set a location',
    });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    return;
  }

  // Check if apiary number already exists (with safe array check)
  if (Array.isArray(availableApiaries) && availableApiaries.some(apiary => apiary.number === apiaryFormData.number)) {
    setNotification({
      show: true,
      message: 'An apiary with this number already exists',
    });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("token") || localStorage.getItem('authToken') || localStorage.getItem('auth-token');
    if (!token) {
      throw new Error("No token found. Please log in again.");
    }
   
    // Create clean data to avoid circular references
    const newApiaryData = {
      name: String(apiaryFormData.name).trim(),
      number: String(apiaryFormData.number).trim(),
      hiveCount: Number(apiaryFormData.hiveCount) || 0,
      location: {
        latitude: Number(apiaryFormData.location.latitude),
        longitude: Number(apiaryFormData.location.longitude),
        // Include location ID if it exists (for existing locations)
        ...(apiaryFormData.location.id && { locationId: apiaryFormData.location.id })
      },
      kilosCollected: Number(apiaryFormData.honeyCollected) || 0
    };

    console.log('Sending clean apiary data to API:', newApiaryData);

    const response = await fetch('/api/apiaries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(newApiaryData),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to create apiary' };
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Apiary created successfully:', result);

    // Add the new apiary to available apiaries list with clean data
    const newApiary = result.apiary || result;
    const cleanApiary = {
      id: newApiary.id,
      name: newApiary.name,
      number: newApiary.number,
      hiveCount: Number(newApiary.hiveCount) || 0,
      honeyCollected: newApiary.honeyCollected,
      location: {
        id: newApiary.location?.id,
        name: newApiary.location?.name,
        latitude: Number(newApiary.location?.latitude),
        longitude: Number(newApiary.location?.longitude)
      }
    };

    if (Array.isArray(availableApiaries)) {
      setAvailableApiaries(prev => [cleanApiary, ...prev]);
    } else {
      setAvailableApiaries([cleanApiary]);
    }

    // Store the success message before resetting form
    const successMessage = `Apiary "${apiaryFormData.name}" created successfully!`;

    // Reset form with clean initial state
    setApiaryFormData({
      name: '',
      number: '',
      hiveCount: 0,
      honeyCollected: 0,
      location: null
    });

    // Close modal
    setShowApiaryModal(false);

    setNotification({
      show: true,
      message: successMessage,
    });

    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);

    // Refresh the apiaries list
    await refreshApiariesFromDatabase();

  } catch (error) {
    console.error('Error creating apiary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    setNotification({
      show: true,
      message: `Error: ${errorMessage}`,
    });

    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 5000);
  } finally {
    setLoading(false);
  }
};
 const LocationConfirmDialog = () => (
  showLocationConfirm && (
    <div 
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50"
      style={{
        left: `${clickPosition.x}px`,
        top: `${clickPosition.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <div className="text-sm font-medium text-gray-900 mb-2">
        Save this location?
      </div>
      <div className="text-xs text-gray-600 mb-3">
        Lat: {selectedLocation?.lat.toFixed(6)}<br/>
        Lng: {selectedLocation?.lng.toFixed(6)}
      </div>
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLocationConfirm();
          }}
          disabled={isSaving}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLocationCancel();
          }}
          disabled={isSaving}
          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  )
);

// Define performLogout function
const performLogout = async () => {
  // Clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Clear session storage
  sessionStorage.clear();
  
  // Make API call to backend logout endpoint if needed
  try {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include' // Include cookies
    });
  } catch (error) {
    console.warn('Backend logout failed:', error);
  }
};

const handleLogout = async () => {
  try {
    setIsLoggingOut(true);
    console.log('Starting logout process...');
    
    // Clear client-side auth data and call logout API
    await performLogout();
    
    // Also sign out from NextAuth if using OAuth
    await signOut({ redirect: false });
    
    console.log('Logout completed, redirecting to login...');
    
    // Redirect to login page
    router.push('/login');
    
    // Force a hard refresh to ensure all state is cleared
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
    
  } catch (error) {
    console.error('Logout error:', error);
    // Still redirect even if there's an error
    router.push('/login');
  } finally {
    setIsLoggingOut(false);
  }
};

// Add this component for displaying saved locations in the apiary modal
const SavedLocationsSelector = () => (
  savedApiaryLocations.length > 0 && (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Or select from saved locations:
      </label>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {savedApiaryLocations.map((location) => (
          <button
            key={location.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelectExistingLocation(location);
            }}
            className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
          >
            <div className="font-medium">{location.name}</div>
            <div className="text-xs text-gray-500">
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
);

// Also add this helper function to clean location data
const cleanLocationData = (location: any) => {
  if (!location) return null;
  
  return {
    id: location.id,
    name: location.name,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    lat: Number(location.latitude || location.lat),
    lng: Number(location.longitude || location.lng),
    createdAt: location.createdAt
  };
};

  const [isSaving, setIsSaving] = useState<boolean>(false);

  

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

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Fetching saved locations with auth...');
    
    // First try to get saved location templates
    const locationsResponse = await fetch('/api/apiaries/locations', {
      headers,
      credentials: 'include',
    });

    let locations = [];

    if (locationsResponse.ok) {
      const locationTemplates = await locationsResponse.json();
      console.log('Fetched location templates:', locationTemplates);
      
      locations = locationTemplates.map(loc => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        createdAt: loc.createdAt,
        isTemplate: true // Mark as template
      }));
    }

    // Also get unique locations from all apiaries (including those with batchId)
    const apiariesResponse = await fetch('/api/apiaries', {
      headers,
      credentials: 'include',
    });

    if (apiariesResponse.ok) {
      const apiariesData = await apiariesResponse.json();
      console.log('Fetched apiaries for location extraction:', apiariesData);
      
      let apiaries = [];
      if (Array.isArray(apiariesData)) {
        apiaries = apiariesData;
      } else if (apiariesData.apiaries && Array.isArray(apiariesData.apiaries)) {
        apiaries = apiariesData.apiaries;
      } else if (apiariesData.data && Array.isArray(apiariesData.data)) {
        apiaries = apiariesData.data;
      }

      // Extract unique locations from apiaries
      const apiaryLocations = apiaries
        .filter(apiary => apiary.latitude && apiary.longitude)
        .map(apiary => ({
          id: `apiary_${apiary.id}`, // Prefix to avoid ID conflicts
          name: `${apiary.name} (${apiary.number})`,
          latitude: apiary.latitude,
          longitude: apiary.longitude,
          createdAt: apiary.createdAt,
          isTemplate: false, // Mark as from apiary
          originalApiaryId: apiary.id
        }));

      // Remove duplicates based on coordinates (within 0.001 degree tolerance)
      const uniqueApiaryLocations = apiaryLocations.filter((loc, index, arr) => {
        return !arr.slice(0, index).some(existingLoc => 
          Math.abs(existingLoc.latitude - loc.latitude) < 0.001 &&
          Math.abs(existingLoc.longitude - loc.longitude) < 0.001
        );
      });

      // Also remove apiaries that are too close to existing templates
      const uniqueNewLocations = uniqueApiaryLocations.filter(apiaryLoc => {
        return !locations.some(templateLoc => 
          Math.abs(templateLoc.latitude - apiaryLoc.latitude) < 0.001 &&
          Math.abs(templateLoc.longitude - apiaryLoc.longitude) < 0.001
        );
      });

      locations = [...locations, ...uniqueNewLocations];
    }

    console.log('Final processed locations:', locations);
    setSavedApiaryLocations(locations);
    
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

// Add this useEffect to load saved locations when component mounts
useEffect(() => {
  const loadSavedData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in again.");
        return;
      }

      // Load saved locations
      const locationsResponse = await fetch('/api/apiaries/locations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (locationsResponse.ok) {
        const locations = await locationsResponse.json();
        setSavedApiaryLocations(locations);
      } else {
        console.error('Failed to load saved locations');
      }

      // Load available apiaries
      const apiariesResponse = await fetch('/api/apiaries', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (apiariesResponse.ok) {
        const apiaries = await apiariesResponse.json();
        setAvailableApiaries(apiaries);
      } else {
        console.error('Failed to load available apiaries');
      }

    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  loadSavedData();
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





// Add these handler functions
const handleLocationConfirm = async (name: string | null = null) => {
  if (!selectedLocation) return;

  try {
    setIsSaving(true);
    
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('auth-token');
    
    if (!token) {
      setNotification({
        show: true,
        message: 'Authentication required. Please log in again.',
      });
      setTimeout(() => setNotification({ show: false, message: '' }), 3000);
      return;
    }

    // Create clean location data (avoid circular references)
    const locationData = {
      latitude: Number(selectedLocation.lat),
      longitude: Number(selectedLocation.lng),
      name: name || `Location ${new Date().toLocaleDateString()}`,
    };

    console.log('Sending location data:', locationData); // Debug log

     
    const response = await fetch('/api/apiaries/locations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      
      body: JSON.stringify(locationData)
    });
    console.log('→ payload about to be stringified:', locationData);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to save location' };
      }
      throw new Error(errorData.error || errorData.message || 'Failed to save location');
    }

    const newLocation = await response.json();
    console.log('Location saved successfully:', newLocation);
    
    // Create clean location object for state updates
    const cleanLocation = {
      id: newLocation.id,
      name: newLocation.name,
      latitude: Number(newLocation.latitude),
      longitude: Number(newLocation.longitude),
      lat: Number(newLocation.latitude),
      lng: Number(newLocation.longitude),
      createdAt: newLocation.createdAt
    };
    
    // Update the locations list
    setLocations(prev => [cleanLocation, ...prev]);
    setSavedApiaryLocations(prev => [cleanLocation, ...prev]);
    
    // If we're in the context of creating an apiary, set this as the selected location
    if (showApiaryModal) {
      setApiaryFormData(prev => ({
        ...prev,
        location: cleanLocation
      }));
    }
    
    // Close the confirmation dialog
    setShowLocationConfirm(false);
    setSelectedLocation(null);
    
    // Show success notification
    setNotification({
      show: true,
      message: 'Location saved successfully!',
    });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
    
  } catch (error) {
    console.error('Error saving location:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    setNotification({
      show: true,
      message: `Error saving location: ${errorMessage}`,
    });
    setTimeout(() => setNotification({ show: false, message: '' }), 5000);
  } finally {
    setIsSaving(false);
  }
};


const handleSelectExistingLocation = (location: ApiaryLocation) => {
  setApiaryFormData(prev => ({
    ...prev,
    location: {
      id: location.id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      lat: location.latitude,
      lng: location.longitude
    }
  }));
  
  setNotification({
    show: true,
    message: `Location "${location.name}" selected for apiary`,
  });
  setTimeout(() => setNotification({ show: false, message: '' }), 2000);
};





// Remove the unused saveApiaryLocation function
const handleLocationCancel = () => {
  setShowLocationConfirm(false);
  setSelectedLocation(null);
};

  return (
    <div className="flex flex-col space-y-6 p-6 min-h-screen bg-gradient-to-b from-yellow-200 to-white text-black">
      {/* Enhanced Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-500 ease-in-out z-20 ${sidebarOpen ? 'w-72' : 'w-0'} overflow-hidden shadow-2xl`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="relative z-10">
          <div className="p-6 flex justify-between items-center border-b border-gray-700/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">Navigation</h2>
            <button onClick={toggleSidebar} className="p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-300">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8 px-4">
            <ul className="space-y-3">
              {[
                { icon: Home, label: 'Dashboard', href: '/dashboard' },
                { icon: Layers, label: 'Batches', href: '/batches' },
                { icon: Activity, label: 'Analytics', href: '#' },
                { icon: Wallet, label: 'Token Wallet', href: '#' },
                { icon: Users, label: 'Profile', href: '/profile' },
                { icon: Settings, label: 'Settings', href: '#' },
                { icon: HelpCircle, label: 'Help', href: '#' }
              ].map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="group flex items-center px-4 py-4 rounded-xl hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-amber-500/20 transition-all duration-300 transform hover:translate-x-2">
                    <item.icon className="h-6 w-6 mr-4 transition-all duration-300 group-hover:text-yellow-400 group-hover:scale-110" />
                    <span className="font-medium group-hover:text-yellow-300 transition-colors duration-300">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

{/* Enhanced Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-md bg-black/30 z-10 transition-all duration-500"
          onClick={toggleSidebar}
        ></div>
      )}

       {/* Enhanced Header Section */}
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">HoneyCertify</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Token Balance Section (Preserved) */}
            <div className="group relative mr-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-xl 
                          p-6 rounded-2xl border border-gray-700/30 shadow-2xl
                          transform transition-all duration-500 hover:scale-105 hover:shadow-purple-500/20
                          flex items-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-purple-500/10 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-2 right-4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute bottom-3 right-8 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
              
              <div className="relative z-10">
                <Wallet className="h-8 w-8 text-yellow-400 mr-4 transition-all duration-300 
                                 group-hover:text-yellow-300 group-hover:scale-110 group-hover:rotate-12 
                                 drop-shadow-lg" />
              </div>
              
              <div className="flex-1 relative z-10">
                <p className="text-sm text-gray-400 mb-1 transition-all duration-300 group-hover:text-gray-300">
                  Token Balance
                </p>
                <p className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 
                             bg-clip-text text-transparent transition-all duration-300 
                             group-hover:from-yellow-300 group-hover:to-white">
                  {tokenBalance}
                </p>
              </div>
              
              <button
                onClick={() => router.push('/buy-token')}
                className="group/btn relative ml-6 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 
                           text-white rounded-xl font-semibold overflow-hidden
                           transform transition-all duration-300 
                           hover:from-yellow-400 hover:to-amber-400 
                           hover:scale-110 hover:shadow-2xl hover:shadow-yellow-500/30
                           active:scale-95 flex items-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                               transform -skew-x-12 -translate-x-full 
                               group-hover/btn:translate-x-full transition-transform duration-700"></div>
                
                <PlusCircle className="h-5 w-5 mr-2 relative z-10 transition-transform duration-300 
                                     group-hover/btn:rotate-180" />
                <span className="relative z-10">Buy</span>
              </button>
            </div>

            {/* Create Batch Button (Preserved) */}
            <button
              onClick={() => setShowBatchModal(true)}
              className="group relative overflow-hidden px-6 py-3 
                         bg-gradient-to-r from-emerald-600 to-green-500 
                         text-white rounded-xl font-semibold shadow-2xl
                         transform transition-all duration-500 
                         hover:from-emerald-500 hover:to-green-400 
                         hover:scale-105 hover:shadow-green-500/30 hover:-translate-y-2
                         active:scale-95 active:translate-y-0
                         flex items-center border border-green-400/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                             transform -skew-x-12 -translate-x-full 
                             group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-green-400 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              
              <Package className="w-5 h-5 mr-3 relative z-10 transition-all duration-300 
                                group-hover:rotate-12 group-hover:scale-110" />
              <span className="relative z-10 transition-all duration-300 group-hover:tracking-wider">
                Create Batch
              </span>
              <Sparkles className="w-4 h-4 ml-2 relative z-10 opacity-0 transition-all duration-300 
                                group-hover:opacity-100 group-hover:rotate-180" />
            </button>

            {/* Premium Button (Preserved) */}
            <button
              onClick={() => router.push('/premium')}
              className="group relative overflow-hidden px-6 py-3 
                         bg-gradient-to-r from-amber-500 to-yellow-500 
                         text-white rounded-xl font-semibold shadow-2xl
                         transform transition-all duration-500 
                         hover:from-amber-400 hover:to-yellow-400 
                         hover:scale-105 hover:shadow-yellow-500/30 hover:-translate-y-2
                         active:scale-95 active:translate-y-0
                         flex items-center border border-yellow-400/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                             transform -skew-x-12 -translate-x-full 
                             group-hover:translate-x-full transition-transform duration-800"></div>
              
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-300 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              
              <Package className="w-5 h-5 mr-3 relative z-10 transition-all duration-300 
                                group-hover:rotate-12 group-hover:scale-110" />
              <span className="relative z-10 transition-all duration-300 group-hover:tracking-wider">
                Premium
              </span>
              <div className="w-2 h-2 ml-2 relative z-10 bg-yellow-200 rounded-full 
                             opacity-0 group-hover:opacity-100 animate-pulse"></div>
            </button>

            {/* Logout Button (Preserved) */}
            <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="group relative overflow-hidden px-6 py-3
                 bg-gradient-to-r from-red-600 to-rose-500
                 text-white rounded-xl font-semibold shadow-2xl
                 transform transition-all duration-500
                 hover:from-red-500 hover:to-rose-400
                 hover:scale-105 hover:shadow-red-500/30 hover:-translate-y-2
                 active:scale-95 active:translate-y-0
                 flex items-center border border-red-400/20
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                      transform -skew-x-12 -translate-x-full
                      group-hover:translate-x-full transition-transform duration-600"></div>
      
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-400 to-rose-400
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
      
      <LogOut className={`w-5 h-5 mr-3 relative z-10 transition-all duration-300
                         group-hover:-rotate-12 group-hover:scale-110
                         ${isLoggingOut ? 'animate-spin' : ''}`} />
      
      <span className="relative z-10 transition-all duration-300 group-hover:tracking-wider">
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </span>
    </button>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mt-4 relative z-10 opacity-75">
          Last updated: {lastUpdated}
        </p>
      </header>

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

            {/* Location Settings Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <div className="bg-green-100 p-1 rounded mr-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                Location Settings
              </h4>

              {/* Debug info - Show more detailed information */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs text-blue-800">
                  <p><strong>🔍 Debug Info:</strong></p>
                  <div className="mt-1 space-y-1">
                    <p>• Saved locations count: <span className="font-mono">{savedApiaryLocations?.length || 0}</span></p>
                    <p>• Array exists: <span className="font-mono">{savedApiaryLocations ? 'Yes' : 'No'}</span></p>
                    <p>• Array type: <span className="font-mono">{Array.isArray(savedApiaryLocations) ? 'Array' : typeof savedApiaryLocations}</span></p>
                    <p>• Show condition: <span className="font-mono">{(savedApiaryLocations && savedApiaryLocations.length > 0).toString()}</span></p>
                    {savedApiaryLocations && savedApiaryLocations.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Show saved locations data</summary>
                        <pre className="mt-2 p-2 bg-white rounded border text-xs overflow-x-auto">
                          {JSON.stringify(savedApiaryLocations, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>

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
                      Choose from saved locations, click on the map, or paste a Google Maps link
                    </p>
                  </div>
                </div>
              )}

              {/* Saved Locations Dropdown - Always show, but with different content */}
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-100 p-1 rounded mr-2">
                    <Star className="h-4 w-4 text-purple-600" />
                  </div>
                  <h5 className="font-medium text-purple-800">Saved Locations</h5>
                </div>
                
                {savedApiaryLocations && savedApiaryLocations.length > 0 ? (
                  <>
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
                          // Reset the select value
                          e.target.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">🏠 Select from your saved locations...</option>
                      {savedApiaryLocations.map(location => (
                        <option key={location.id} value={location.id}>
                          📍 {location.name} - {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                        </option>
                      ))}
                    </select>
                    
                    <p className="text-xs text-purple-600 mt-2">
                      💡 Choose from locations you've previously saved to quickly set up your apiary
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-purple-300 mb-2">
                      <Star className="h-8 w-8 mx-auto" />
                    </div>
                    <p className="text-sm text-purple-600 mb-2">No saved locations yet</p>
                    <p className="text-xs text-purple-500">
                      Create your first apiary to start building your saved locations library
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // You can add a function here to manually refresh saved locations
                        console.log('Refreshing saved locations...');
                        // Example: refreshSavedLocations();
                      }}
                      className="mt-2 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md text-xs transition-colors"
                    >
                      🔄 Refresh Locations
                    </button>
                  </div>
                )}
              </div>

              {/* Google Maps Link Input Section */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
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
     {/* Token Wallet Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Token Wallet Section - Equal height with token distribution */}
  <div className="bg-white p-4 rounded-lg shadow text-black">
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

  {/* Google Maps Section - Display Apiary Markers */}
<div className="bg-white p-4 rounded-lg shadow text-black h-fit">
  <h2 className="text-lg font-semibold mb-4">Apiary Locations</h2>
  <p className="text-sm text-gray-600 mb-3">View all your apiaries on the map. Click markers to see details.</p>
  <div 
    ref={mapRef}
    className="w-full rounded-lg border border-gray-300"
    style={{ height: '450px' }}
  />
</div>
</div>


{/* Apiary Details Modal - Shows when clicking on a marker */}
{selectedApiary && (
  <>
    {/* Modal backdrop */}
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedApiary(null)}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedApiary.name}</h3>
                <p className="text-blue-100 text-sm">Apiary Details</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedApiary(null)}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Apiary ID */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Apiary ID:</span>
              <span className="font-semibold text-gray-800">{selectedApiary.number}</span>
            </div>

            {/* Number of Hives */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Number of Hives:</span>
              <span className="font-semibold text-gray-800">{selectedApiary.hiveCount}</span>
            </div>

            {/* Honey Collected */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Honey Collected:</span>
              <span className="font-semibold text-gray-800">{selectedApiary.honeyCollected} kg</span>
            </div>

            {/* Location Coordinates */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 block mb-2">Location:</span>
              <div className="text-sm text-gray-800">
                <div>Latitude: {selectedApiary.location?.latitude?.toFixed(6)}</div>
                <div>Longitude: {selectedApiary.location?.longitude?.toFixed(6)}</div>
              </div>
            </div>

            {/* Created Date (if available) */}
            {selectedApiary.createdAt && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Created:</span>
                <span className="text-sm text-gray-800">
                  {new Date(selectedApiary.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setSelectedApiary(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
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
  };



