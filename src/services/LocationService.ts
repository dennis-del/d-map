import { TransportMode, SearchResult, Location } from '../types/map';

// OpenStreetMap Nominatim free service - rate limit compliant
// In a production app, this should be proxied through a backend
const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';
const OSRM_API = 'https://router.project-osrm.org/route/v1';

/**
 * Calculate the shortest distance between two points using the Haversine formula
 */
export const calculateShortestDistance = (from: Location, to: Location): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Returns distance in meters
};

/**
 * Search for a location by name or address
 */
export const searchLocation = async (query: string): Promise<SearchResult[]> => {
  try {
    if (!query || query.trim().length < 3) return [];

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
    });

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));

    const response = await fetch(`${NOMINATIM_API}?${params}`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'MapApp (https://example.com)'
      }
    });

    if (!response.ok) {
      throw new Error('Error searching for locations');
    }

    const data = await response.json();
    
    return data.map((item: any) => {
      const name = item.display_name.split(',')[0];
      const address = item.display_name;
      
      return {
        id: item.place_id,
        name,
        address,
        location: [parseFloat(item.lat), parseFloat(item.lon)],
      };
    });
  } catch (error) {
    console.error('Error searching for locations:', error);
    return [];
  }
};

/**
 * Gets a route between two locations
 */
export const getRoute = async (
  from: Location,
  to: Location,
  mode: TransportMode = 'car'
) => {
  try {
    const profile = mode === 'car' ? 'driving' : mode === 'bicycle' ? 'cycling' : 'walking';
    const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    
    const url = `${OSRM_API}/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Error calculating route');
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    const route = data.routes[0];
    
    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      legs: route.legs,
    };
  } catch (error) {
    console.error('Error getting route:', error);
    throw error;
  }
};

/**
 * Reverse geocode to get address from coordinates
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'MapApp (https://example.com)'
      }
    });

    if (!response.ok) {
      throw new Error('Error reverse geocoding');
    }

    const data = await response.json();
    return data.display_name || 'Unknown location';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return 'Unknown location';
  }
};

// Local storage for saved locations
export const saveLocation = (location: Location, name: string): void => {
  try {
    const savedLocations = getSavedLocations();
    const newLocation = {
      id: Date.now().toString(),
      name,
      address: location.address || '',
      location: [location.lat, location.lng],
      lastUsed: new Date(),
    };
    
    savedLocations.push(newLocation);
    localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

export const getSavedLocations = () => {
  try {
    const savedLocations = localStorage.getItem('savedLocations');
    return savedLocations ? JSON.parse(savedLocations) : [];
  } catch (error) {
    console.error('Error getting saved locations:', error);
    return [];
  }
};