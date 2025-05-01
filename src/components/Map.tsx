import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import {
  createPulsingDotIcon,
  destinationIcon,
  addIconStyles,
} from "./MapIcons";
import SearchBar from "./SearchBar";
import DirectionsPanel from "./DirectionsPanel";
import MapControls from "./MapControls";
import SideMenu from "./SideMenu";
import {
  Location,
  RouteInfo,
  TransportMode,
  SearchResult,
  SavedLocation,
} from "../types/map";
import {
  getRoute,
  reverseGeocode,
  getSavedLocations,
} from "../services/LocationService";

const Map: React.FC = () => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const locationMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [accuracyCircleRef, setAccuracyCircleRef] = useState<L.Circle | null>(
    null
  );
  const watchIdRef = useRef<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [startAddress, setStartAddress] = useState<string>("");
  const [endAddress, setEndAddress] = useState<string>("");
  const [showMenu, setShowMenu] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const locationRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationMaxRetries = useRef(3);
  const locationRetryCount = useRef(0);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      addIconStyles();

      const locations = getSavedLocations();
      setSavedLocations(locations);
    }

    // Check if the browser supports geolocation
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
    }

    return () => {
      stopLocationTracking();
      clearLocationRetryTimeout();
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

  const clearLocationRetryTimeout = () => {
    if (locationRetryTimeoutRef.current) {
      clearTimeout(locationRetryTimeoutRef.current);
      locationRetryTimeoutRef.current = null;
    }
  };

  const calculateRoute = async () => {
    if (!currentLocation || !destination) return;

    try {
      const routeData = await getRoute(
        currentLocation,
        destination,
        transportMode
      );

      if (routeLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      if (mapRef.current) {
        const coordinates = routeData.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        routeLayerRef.current = L.polyline(
          coordinates as L.LatLngExpression[],
          {
            color: "#3B82F6",
            weight: 6,
            opacity: 0.8,
            lineJoin: "round",
          }
        ).addTo(mapRef.current);

        const bounds = routeLayerRef.current.getBounds();
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }

      const instructions = routeData.legs[0].steps.map(
        (step: any, index: number) => ({
          text: step.maneuver.instruction,
          distance: step.distance,
          time: step.duration,
          type: step.maneuver.type,
          index,
        })
      );

      setRouteInfo({
        distance: routeData.distance,
        duration: routeData.duration,
        instructions,
      });

      setShowDirections(true);
    } catch (error) {
      console.error("Error calculating route:", error);
      setLocationError("Could not calculate route. Please try again.");
    }
  };

  // Get device OS information to provide more specific guidance
  const getDeviceOS = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    if (/android/i.test(userAgent)) {
      return "Android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return "iOS";
    }

    return "unknown";
  };

  // Get browser information for more specific troubleshooting
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      return "Safari";
    }
    
    if (/Chrome/.test(userAgent)) {
      return "Chrome";
    }

    if (/Firefox/.test(userAgent)) {
      return "Firefox";
    }

    return "unknown";
  };

  // Generate device-specific help instructions
  const getDeviceSpecificHelp = () => {
    const os = getDeviceOS();
    const browser = getBrowserInfo();
    
    if (os === "iOS") {
      if (browser === "Safari") {
        return "On iOS, go to Settings > Safari > Privacy & Security > Location Services and ensure Safari is allowed to access your location.";
      } else {
        return "On iOS, go to Settings > Privacy & Security > Location Services and ensure your browser is allowed to access your location.";
      }
    } else if (os === "Android") {
      return "On Android, go to Settings > Location > App permissions > Browser (or Chrome) and ensure location access is enabled.";
    }
    
    return "Please ensure location services are enabled for your browser in your device settings.";
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationEnabled(true);
    setLocationError(null);
    locationRetryCount.current = 0;

    // Reset permission states when starting new tracking
    if (permissionDenied) {
      setPermissionDenied(false);
    }

    // On mobile, start with less strict options for initial location
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const initialOptions = {
      enableHighAccuracy: !isMobile, // false for mobile initially for faster response
      maximumAge: isMobile ? 60000 : 30000,
      timeout: isMobile ? 15000 : 10000,
    };

    setPermissionAsked(true);
    
    console.log("Requesting location with options:", initialOptions);
    
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      (error) => {
        console.log("Initial position error:", error.code, error.message);
        
        // Try again with different options
        const fallbackOptions = {
          enableHighAccuracy: isMobile, // Try opposite setting
          maximumAge: 0, // No cache
          timeout: 30000, // Longer timeout
        };
        
        console.log("Retrying with fallback options:", fallbackOptions);
        
        navigator.geolocation.getCurrentPosition(
          handlePositionSuccess,
          handlePositionError,
          fallbackOptions
        );
      },
      initialOptions
    );
  };

  const handlePositionSuccess = async (position: GeolocationPosition) => {
    console.log("Position success:", position);
    const { latitude, longitude, accuracy } = position.coords;

    clearLocationRetryTimeout();
    locationRetryCount.current = 0;
    
    const locationData = { lat: latitude, lng: longitude };
    setCurrentLocation(locationData);

    try {
      const address = await reverseGeocode(latitude, longitude);
      setStartAddress(address);
    } catch (error) {
      console.error("Error getting address:", error);
      setStartAddress("Current Location");
    }

    if (mapRef.current) {
      // Adjust zoom level based on accuracy, but capped for usability
      const zoomLevel = accuracy < 100 ? 17 : accuracy < 500 ? 15 : 14;
      mapRef.current.setView([latitude, longitude], zoomLevel);

      if (!locationMarkerRef.current) {
        locationMarkerRef.current = L.marker([latitude, longitude], {
          icon: createPulsingDotIcon(),
          zIndexOffset: 1000,
        })
          .addTo(mapRef.current)
          .bindPopup("Your current location");
      } else {
        locationMarkerRef.current.setLatLng([latitude, longitude]);
      }

      const circleColor =
        accuracy < 200 ? "#4CAF50" : accuracy < 1000 ? "#FFC107" : "#FF5722";
      if (accuracyCircleRef) {
        accuracyCircleRef
          .setLatLng([latitude, longitude])
          .setRadius(accuracy)
          .setStyle({
            color: circleColor,
            fillColor: circleColor,
          });
      } else {
        const circle = L.circle([latitude, longitude], {
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: 0.1,
          radius: accuracy,
          weight: 1,
        }).addTo(mapRef.current);
        setAccuracyCircleRef(circle);
      }

      if (accuracy > 1000) {
        setLocationError(
          "Location accuracy is low. Try moving to an area with better GPS signal or wifi connectivity."
        );
      } else {
        setLocationError(null);
      }
    }
    setIsLocating(false);
    startPositionWatch();
  };

  const retryLocationRequest = () => {
    if (locationRetryCount.current < locationMaxRetries.current) {
      locationRetryCount.current += 1;
      console.log(`Retrying location request (${locationRetryCount.current}/${locationMaxRetries.current})`);
      
      clearLocationRetryTimeout();
      
      const options = {
        enableHighAccuracy: locationRetryCount.current > 1, // Try with high accuracy on later attempts
        maximumAge: 0,
        timeout: 20000 + (locationRetryCount.current * 5000), // Increase timeout with each retry
      };
      
      setLocationError(`Trying to get your location (attempt ${locationRetryCount.current}/${locationMaxRetries.current})...`);
      
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        (error) => {
          if (locationRetryCount.current >= locationMaxRetries.current) {
            handlePositionError(error);
          } else {
            // Schedule another retry
            locationRetryTimeoutRef.current = setTimeout(retryLocationRequest, 2000);
          }
        },
        options
      );
    } else {
      setLocationError("Unable to get your location after multiple attempts. Please check your settings.");
      setIsLocating(false);
      setLocationEnabled(false);
    }
  };

  const handlePositionError = (error: GeolocationPositionError) => {
    console.error(`Error getting location: ${error.code} - ${error.message}`);
    let errorMessage = "Couldn't get your location. ";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setPermissionDenied(true);
        const deviceHelp = getDeviceSpecificHelp();
        errorMessage = `Location access denied. ${deviceHelp}`;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage =
          "Unable to detect your location. Check if location services are enabled and try again.";
        // For this specific error, try to retry
        if (locationRetryCount.current < locationMaxRetries.current) {
          locationRetryTimeoutRef.current = setTimeout(retryLocationRequest, 2000);
          return;
        }
        break;
      case error.TIMEOUT:
        errorMessage =
          "Location request timed out. Check your internet connection and try again.";
        // For timeout, also retry
        if (locationRetryCount.current < locationMaxRetries.current) {
          locationRetryTimeoutRef.current = setTimeout(retryLocationRequest, 2000);
          return;
        }
        break;
      default:
        errorMessage += error.message;
    }

    setLocationError(errorMessage);
    setLocationEnabled(false);
    setIsLocating(false);
  };

  const startPositionWatch = () => {
    // If we already have a watch active, clear it first
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const watchOptions = {
      enableHighAccuracy: true,
      maximumAge: isMobile ? 10000 : 15000, // Shorter cache time for mobile
      timeout: isMobile ? 20000 : 30000,
    };

    console.log("Starting position watch with options:", watchOptions);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("Watch position update:", latitude, longitude, accuracy);

        const locationData = { lat: latitude, lng: longitude };
        setCurrentLocation(locationData);

        if (mapRef.current && locationMarkerRef.current) {
          locationMarkerRef.current.setLatLng([latitude, longitude]);

          if (accuracyCircleRef) {
            const circleColor =
              accuracy < 200
                ? "#4CAF50"
                : accuracy < 1000
                ? "#FFC107"
                : "#FF5722";
            accuracyCircleRef
              .setLatLng([latitude, longitude])
              .setRadius(accuracy)
              .setStyle({
                color: circleColor,
                fillColor: circleColor,
              });
          }

          if (destination) {
            calculateRoute();
          }
        }
      },
      (error) => {
        console.error("Watch position error:", error.code, error.message);
        
        // If the watch fails due to timeout, restart it
        if (error.code === error.TIMEOUT) {
          console.log("Watch position timeout, restarting...");
          stopLocationTracking();
          
          // Small delay before restarting
          setTimeout(() => {
            if (locationEnabled) {
              startLocationTracking();
            }
          }, 1000);
        }
      },
      watchOptions
    );
  };

  const stopLocationTracking = () => {
    console.log("Stopping location tracking");
    clearLocationRetryTimeout();
    
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
    setStartAddress("");
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
      lat: typeof lat === "number" ? lat : parseFloat(lat),
      lng: typeof lng === "number" ? lng : parseFloat(lng),
      name: searchResult.name,
      address: searchResult.address,
    };
    setDestination(destinationData);

    if (mapRef.current) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng([
          destinationData.lat,
          destinationData.lng,
        ]);
      } else {
        destinationMarkerRef.current = L.marker(
          [destinationData.lat, destinationData.lng],
          {
            icon: destinationIcon,
          }
        )
          .addTo(mapRef.current)
          .bindPopup(searchResult.name);
      }
    }

    const newLocation = {
      id: Date.now().toString(),
      name: searchResult.name,
      address: searchResult.address,
      location: searchResult.location,
      lastUsed: new Date(),
    };

    const updatedLocations = [...savedLocations, newLocation];
    setSavedLocations(updatedLocations);
    localStorage.setItem("savedLocations", JSON.stringify(updatedLocations));
  };

  const handleSelectSavedLocation = (location: SavedLocation) => {
    const searchResult: SearchResult = {
      id: location.id,
      name: location.name,
      address: location.address,
      location: location.location,
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
    setEndAddress("");
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

  // Function to request location permissions directly
  const requestLocationPermission = () => {
    setPermissionAsked(true);
    startLocationTracking();
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div ref={mapContainerRef} id="map" className="h-full w-full z-0"></div>

      <SearchBar
        onSelectLocation={handleSelectDestination}
        onToggleMenu={() => setShowMenu(true)}
      />

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

      {!permissionAsked && !locationEnabled && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50 shadow-md max-w-xs text-center">
          <p className="mb-2">This app needs your location to provide directions</p>
          <button 
            onClick={requestLocationPermission}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Enable Location
          </button>
        </div>
      )}

      {permissionDenied && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50 shadow-md max-w-sm">
          <h3 className="font-bold mb-1">Location Access Required</h3>
          <p className="mb-2">{getDeviceSpecificHelp()}</p>
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-sm"
            onClick={() => setPermissionDenied(false)}
          >
            I've Enabled It
          </button>
        </div>
      )}

      {locationError && !permissionDenied && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-md max-w-sm">
          <span className="block sm:inline">{locationError}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setLocationError(null)}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Map;