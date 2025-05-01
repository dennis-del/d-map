import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { createPulsingDotIcon, destinationIcon, addIconStyles } from './MapIcons';
import SearchBar from './SearchBar';
import DirectionsPanel from './DirectionsPanel';
import MapControls from './MapControls';
import SideMenu from './SideMenu';
import Canvas2DMap from './Canvas2DMap';
import { Location, RouteInfo, TransportMode, SearchResult, SavedLocation } from '../types/map';
import { getRoute, reverseGeocode, getSavedLocations, saveLocation } from '../services/LocationService';

const Map: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [accuracyCircleRef, setAccuracyCircleRef] = useState<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>('car');
  const [startAddress, setStartAddress] = useState<string>('');
  const [endAddress, setEndAddress] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [showCanvas2D, setShowCanvas2D] = useState(false);
  const [mapRotation, setMapRotation] = useState(0);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
      mapRef.current = map;
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      addIconStyles();
      
      const locations = getSavedLocations();
      setSavedLocations(locations);
    }

    return () => {
      stopLocationTracking();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentLocation && destination) {
      calculateRoute();
    }
  }, [destination, transportMode]);

  useEffect(() => {
    if (locationEnabled && locationMarkerRef.current) {
      centerOnUserLocation();
    }
  }, [locationEnabled]);

  const calculateRoute = async () => {
    if (!currentLocation || !destination) return;
    
    try {
      const routeData = await getRoute(currentLocation, destination, transportMode);
      
      if (routeLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      
      if (mapRef.current) {
        const coordinates = routeData.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
        
        routeLayerRef.current = L.polyline(coordinates as L.LatLngExpression[], {
          color: '#3B82F6',
          weight: 6,
          opacity: 0.8,
          lineJoin: 'round'
        }).addTo(mapRef.current);
        
        const bounds = routeLayerRef.current.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
      
      const instructions = routeData.legs[0].steps.map((step: any, index: number) => ({
        text: step.maneuver.instruction,
        distance: step.distance,
        time: step.duration,
        type: step.maneuver.type,
        index
      }));
      
      setRouteInfo({
        distance: routeData.distance,
        duration: routeData.duration,
        instructions
      });
      
      setShowDirections(true);
    } catch (error) {
      console.error('Error calculating route:', error);
      setLocationError('Could not calculate route. Please try again.');
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationEnabled(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        const locationData = { lat: latitude, lng: longitude };
        setCurrentLocation(locationData);
        
        try {
          const address = await reverseGeocode(latitude, longitude);
          setStartAddress(address);
        } catch (error) {
          console.error('Error getting address:', error);
          setStartAddress('Current Location');
        }
        
        if (mapRef.current) {
          const zoomLevel = accuracy < 100 ? 18 : accuracy < 500 ? 16 : 14;
          mapRef.current.setView([latitude, longitude], zoomLevel);
          
          if (!locationMarkerRef.current) {
            locationMarkerRef.current = L.marker([latitude, longitude], {
              icon: createPulsingDotIcon(),
              zIndexOffset: 1000
            }).addTo(mapRef.current)
              .bindPopup("Your current location");
          } else {
            locationMarkerRef.current.setLatLng([latitude, longitude]);
          }

          const circleColor = accuracy < 100 ? '#4CAF50' : accuracy < 500 ? '#FFC107' : '#FF5722';
          if (accuracyCircleRef) {
            accuracyCircleRef.setLatLng([latitude, longitude])
              .setRadius(accuracy)
              .setStyle({
                color: circleColor,
                fillColor: circleColor
              });
          } else {
            const circle = L.circle([latitude, longitude], {
              color: circleColor,
              fillColor: circleColor,
              fillOpacity: 0.1,
              radius: accuracy,
              weight: 1
            }).addTo(mapRef.current);
            setAccuracyCircleRef(circle);
          }

          if (accuracy > 500) {
            setLocationError("Location accuracy is low. Please ensure GPS is enabled and you have a clear view of the sky.");
          } else {
            setLocationError(null);
          }
        }
        setIsLocating(false);

        startPositionWatch();
      },
      (error) => {
        console.error(`Error getting location: ${error.message}`);
        let errorMessage = "Couldn't get your location. ";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location services in your device settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable. Please check your GPS settings.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += error.message;
        }
        
        setLocationError(errorMessage);
        setLocationEnabled(false);
        setIsLocating(false);
      },
      options
    );
  };

  const startPositionWatch = () => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        const locationData = { lat: latitude, lng: longitude };
        setCurrentLocation(locationData);
        
        if (mapRef.current && locationMarkerRef.current) {
          locationMarkerRef.current.setLatLng([latitude, longitude]);
          
          if (accuracyCircleRef) {
            const circleColor = accuracy < 100 ? '#4CAF50' : accuracy < 500 ? '#FFC107' : '#FF5722';
            accuracyCircleRef.setLatLng([latitude, longitude])
              .setRadius(accuracy)
              .setStyle({
                color: circleColor,
                fillColor: circleColor
              });
          }
          
          if (destination) {
            calculateRoute();
          }
        }
      },
      (error) => {
        console.error("Error watching position:", error);
        if (error.code === error.TIMEOUT) {
          stopLocationTracking();
          startLocationTracking();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (locationMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(locationMarkerRef.current);
      locationMarkerRef.current = null;
    }
    
    if (accuracyCircleRef && mapRef.current) {
      mapRef.current.removeLayer(accuracyCircleRef);
      setAccuracyCircleRef(null);
    }
    
    setLocationEnabled(false);
    setCurrentLocation(null);
    setStartAddress('');
  };

  const toggleLocationTracking = () => {
    if (locationEnabled) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  const centerOnUserLocation = () => {
    if (locationMarkerRef.current && mapRef.current) {
      const latlng = locationMarkerRef.current.getLatLng();
      mapRef.current.setView(latlng, 16);
    }
  };

  const handleSelectDestination = async (searchResult: SearchResult) => {
    if (!locationEnabled) {
      startLocationTracking();
    }
    
    setEndAddress(searchResult.address);
    
    const latLng = searchResult.location as L.LatLngExpression;
    const lat = Array.isArray(latLng) ? latLng[0] : latLng.lat;
    const lng = Array.isArray(latLng) ? latLng[1] : latLng.lng;
    
    const destinationData = { 
      lat: typeof lat === 'number' ? lat : parseFloat(lat), 
      lng: typeof lng === 'number' ? lng : parseFloat(lng),
      name: searchResult.name,
      address: searchResult.address
    };
    setDestination(destinationData);
    
    if (mapRef.current) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng([destinationData.lat, destinationData.lng]);
      } else {
        destinationMarkerRef.current = L.marker([destinationData.lat, destinationData.lng], {
          icon: destinationIcon
        }).addTo(mapRef.current)
          .bindPopup(searchResult.name);
      }
    }
    
    const newLocation = {
      id: Date.now().toString(),
      name: searchResult.name,
      address: searchResult.address,
      location: searchResult.location,
      lastUsed: new Date()
    };
    
    const updatedLocations = [...savedLocations, newLocation];
    setSavedLocations(updatedLocations);
    localStorage.setItem('savedLocations', JSON.stringify(updatedLocations));
  };

  const handleSelectSavedLocation = (location: SavedLocation) => {
    const searchResult: SearchResult = {
      id: location.id,
      name: location.name,
      address: location.address,
      location: location.location
    };
    
    handleSelectDestination(searchResult);
  };

  const clearRoute = () => {
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    
    if (destinationMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
    
    setDestination(null);
    setShowDirections(false);
    setRouteInfo(null);
    setEndAddress('');
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {!showCanvas2D ? (
        <div ref={mapContainerRef} id="map" className="h-full w-full z-0"></div>
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-50">
          <Canvas2DMap
            width={800}
            height={600}
            rotation={mapRotation}
            locations={[
              currentLocation,
              destination,
              ...(savedLocations.map(loc => ({
                lat: Array.isArray(loc.location) ? loc.location[0] : loc.location.lat,
                lng: Array.isArray(loc.location) ? loc.location[1] : loc.location.lng,
                name: loc.name
              })))
            ].filter((loc): loc is Location => loc !== null)}
            onRotationChange={setMapRotation}
          />
        </div>
      )}
      
      <SearchBar 
        onSelectLocation={handleSelectDestination}
        onToggleMenu={() => setShowMenu(true)}
      />
      
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50"
          onClick={() => setShowCanvas2D(!showCanvas2D)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        </button>
        <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      </div>

      <MapControls 
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleLocation={toggleLocationTracking}
        locationEnabled={locationEnabled}
        isLocating={isLocating}
        hasRoute={!!routeInfo}
        onClearRoute={clearRoute}
        transportMode={transportMode}
      />

      <DirectionsPanel 
        isOpen={showDirections}
        routeInfo={routeInfo}
        startAddress={startAddress}
        endAddress={endAddress}
        onClose={() => setShowDirections(false)}
        transportMode={transportMode}
        onTransportModeChange={setTransportMode}
      />

      <SideMenu 
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        savedLocations={savedLocations}
        onSelectLocation={handleSelectSavedLocation}
      />

      {locationError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-md">
          <span className="block sm:inline">{locationError}</span>
          <button 
            className="absolute top-0 right-0 px-4 py-3" 
            onClick={() => setLocationError(null)}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default Map;