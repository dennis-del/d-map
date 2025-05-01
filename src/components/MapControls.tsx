import React from 'react';
import { TransportMode } from '../types/map';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleLocation: () => void;
  locationEnabled: boolean;
  isLocating: boolean;
  hasRoute: boolean;
  onClearRoute: () => void;
  transportMode: TransportMode;
}

const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onToggleLocation,
  locationEnabled,
  isLocating,
  hasRoute,
  onClearRoute
}) => {
  return (
    <>
      {/* Location Button - Moved higher up */}
      <div className="absolute bottom-40 right-6 z-10">
        <button 
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors duration-300 ${
            isLocating ? 'bg-gray-300' : locationEnabled ? 'bg-blue-500' : 'bg-white'
          } hover:opacity-90`}
          onClick={onToggleLocation}
          disabled={isLocating}
          aria-label={locationEnabled ? "Disable location tracking" : "Enable location tracking"}
        >
          {isLocating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 ${locationEnabled ? 'text-white' : 'text-gray-500'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col space-y-2 z-10">
        <button 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50"
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50"
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Clear Route Button */}
      {hasRoute && (
        <div className="absolute bottom-6 left-6 z-10">
          <button 
            className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors duration-300"
            onClick={onClearRoute}
            aria-label="Clear route"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Route
          </button>
        </div>
      )}
    </>
  );
};

export default MapControls;