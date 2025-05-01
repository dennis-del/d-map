import React, { useState, useEffect, useRef } from 'react';
import { SearchResult } from '../types/map';
import { searchLocation } from '../services/LocationService';

interface SearchBarProps {
  onSelectLocation: (location: SearchResult) => void;
  onToggleMenu: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectLocation, onToggleMenu }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add click outside listener to close results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    setIsLoading(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const searchResults = await searchLocation(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleLocationSelect = (location: SearchResult) => {
    setQuery(location.name);
    setShowResults(false);
    onSelectLocation(location);
  };

  return (
    <div 
      ref={searchBarRef}
      className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md z-10 px-4"
    >
      <div className="flex bg-white p-3 rounded-lg shadow-md">
        <button 
          className="mr-2 flex items-center justify-center"
          onClick={onToggleMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search destination..."
            className="w-full border-none outline-none text-base px-2"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-t-2 border-blue-500 rounded-full"></div>
            </div>
          )}
          
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
              {results.map((result) => (
                <div 
                  key={result.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                  onClick={() => handleLocationSelect(result)}
                >
                  <div className="font-medium text-gray-800">{result.name}</div>
                  <div className="text-sm text-gray-600 truncate">{result.address}</div>
                </div>
              ))}
            </div>
          )}
          
          {showResults && query.trim().length >= 3 && results.length === 0 && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg z-20">
              <div className="px-4 py-3 text-sm text-gray-600">
                No results found
              </div>
            </div>
          )}
        </div>
        
        <button className="ml-2 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;