import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack
export const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Blue location icon for the user's position
export const locationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Red destination icon
export const destinationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Make a pulsing dot icon for better mobile UX
export const createPulsingDotIcon = () => {
  return L.divIcon({
    className: 'pulse-dot-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `
      <div class="pulse-dot-outer"></div>
      <div class="pulse-dot-inner"></div>
    `
  });
};

// Custom icon for waypoints
export const waypointIcon = L.divIcon({
  className: 'waypoint-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: '<div class="waypoint-dot"></div>'
});

// Add required CSS for icons
export const addIconStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .pulse-dot-outer {
      background-color: rgba(38, 126, 255, 0.4);
      border-radius: 50%;
      height: 100%;
      width: 100%;
      position: absolute;
      animation: pulse 2s infinite;
    }
    .pulse-dot-inner {
      background-color: rgb(38, 126, 255);
      border-radius: 50%;
      height: 50%;
      width: 50%;
      position: absolute;
      top: 25%;
      left: 25%;
    }
    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 1;
      }
      70% {
        transform: scale(2);
        opacity: 0;
      }
      100% {
        transform: scale(0.5);
        opacity: 0;
      }
    }
    .waypoint-dot {
      background-color: #5a67d8;
      border: 2px solid white;
      border-radius: 50%;
      height: 100%;
      width: 100%;
    }
  `;
  document.head.appendChild(style);
};