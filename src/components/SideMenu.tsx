import React from 'react';
import { SavedLocation } from '../types/map';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  savedLocations: SavedLocation[];
  onSelectLocation: (location: SavedLocation) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  savedLocations,
  onSelectLocation
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Side Menu */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 max-w-[90vw] bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Saved Places</h2>
          <button 
            className="p-2 rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Menu Content - Takes up all available space */}
        <div className="flex-1 p-4 overflow-y-auto">
          {savedLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500">No saved locations yet</p>
              <p className="text-gray-500 text-sm mt-2">Search for places to save them here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedLocations.map((location) => (
                <div 
                  key={location.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 active:bg-gray-200 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectLocation(location);
                    onClose();
                  }}
                >
                  <div className="font-medium text-gray-800">{location.name}</div>
                  <div className="text-sm text-gray-600 truncate">{location.address}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SideMenu;