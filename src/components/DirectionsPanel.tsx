import React from 'react';
import { RouteInfo, TransportMode } from '../types/map';

interface DirectionsPanelProps {
  isOpen: boolean;
  routeInfo: RouteInfo | null;
  startAddress: string;
  endAddress: string;
  onClose: () => void;
  transportMode: TransportMode;
  onTransportModeChange: (mode: TransportMode) => void;
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  isOpen,
  routeInfo,
  startAddress,
  endAddress,
  onClose,
  transportMode,
  onTransportModeChange
}) => {
  if (!isOpen || !routeInfo) return null;

  const formatDistance = (meters: number): string => {
    return meters >= 1000 
      ? `${(meters / 1000).toFixed(1)} km` 
      : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-20 max-h-[70vh] overflow-hidden transition-all duration-300 transform" 
      style={{ 
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      {/* Panel Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">Directions</h2>
          <div className="flex items-center text-sm text-gray-600">
            <span>{formatDistance(routeInfo.distance)}</span>
            <span className="mx-2">•</span>
            <span>{formatDuration(routeInfo.duration)}</span>
          </div>
        </div>
        
        {/* Close button */}
        <button 
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Transport modes */}
      <div className="flex p-2 border-b border-gray-200 bg-gray-50">
        <button 
          className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-md ${transportMode === 'car' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
          onClick={() => onTransportModeChange('car')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <span className="text-xs mt-1">Driving</span>
        </button>
        
        <button 
          className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-md ${transportMode === 'bicycle' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
          onClick={() => onTransportModeChange('bicycle')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <span className="text-xs mt-1">Cycling</span>
        </button>
        
        <button 
          className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-md ${transportMode === 'foot' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
          onClick={() => onTransportModeChange('foot')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs mt-1">Walking</span>
        </button>
      </div>
      
      {/* Route information */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 140px)' }}>
        {/* Start and end locations */}
        <div className="p-4">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Your location</div>
              <div className="text-sm text-gray-600 break-words">{startAddress}</div>
            </div>
          </div>
          
          <div className="w-0.5 h-6 bg-gray-300 ml-4"></div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Destination</div>
              <div className="text-sm text-gray-600 break-words">{endAddress}</div>
            </div>
          </div>
        </div>
        
        {/* Turn-by-turn directions */}
        {routeInfo.instructions && routeInfo.instructions.length > 0 && (
          <div className="border-t border-gray-200 pt-2">
            <h3 className="text-sm font-medium text-gray-700 px-4 py-2">Turn-by-turn directions</h3>
            <ul className="divide-y divide-gray-100">
              {routeInfo.instructions.map((instruction, index) => (
                <li key={index} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-3 text-xs font-medium text-gray-700">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{instruction.text}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>{formatDistance(instruction.distance)}</span>
                        <span className="mx-1">•</span>
                        <span>{Math.round(instruction.time / 60)} min</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectionsPanel;