import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { searchLocations } from '../../utils/geoApi';

const DEMO_LOCATIONS = [
  { id: 'demo1', name: 'Sitaburdi Metro Station', displayName: 'Sitaburdi Metro Station, Nagpur', lat: 21.1460206, lng: 79.0897328, isDemo: true },
  { id: 'demo2', name: 'VR Mall Nagpur', displayName: 'VR Mall Nagpur, Medical Square', lat: 21.1377319, lng: 79.068821, isDemo: true },
  { id: 'demo3', name: 'Hingna T Point (Vasudev Nagar)', displayName: 'Hingna T Point (Vasudev Nagar), Nagpur', lat: 21.1187853, lng: 79.0194659, isDemo: true },
  { id: 'demo4', name: 'Burdi', displayName: 'Burdi, Nagpur', lat: 21.1402262, lng: 79.0871588, isDemo: true },
  { id: 'demo5', name: 'Subash Nagar', displayName: 'Subash Nagar, Nagpur', lat: 21.128, lng: 79.043, isDemo: true },
  { id: 'demo6', name: 'Ganesh Peth Bus Stop', displayName: 'Ganesh Peth Bus Stop, Nagpur', lat: 21.144, lng: 79.102, isDemo: true },
  { id: 'demo7', name: 'Sitaburdi', displayName: 'Sitaburdi, Nagpur', lat: 21.1402262, lng: 79.0871588, isDemo: true },
  { id: 'demo8', name: 'Hingna T Point', displayName: 'Hingna T Point, Nagpur', lat: 21.1229783, lng: 79.0380712, isDemo: true },
  { id: 'demo9', name: 'Lokmanya Nagar', displayName: 'Lokmanya Nagar, Nagpur', lat: 21.1108046, lng: 79.001754, isDemo: true },
  { id: 'demo10', name: 'Isasani', displayName: 'Isasani, Nagpur', lat: 21.101, lng: 78.983, isDemo: true }
];

const LocationAutocomplete = ({ 
  placeholder = "Search location...",
  value = null,
  onChange,
  onMapClick,
  label 
}) => {
  const [query, setQuery] = useState(value ? value.name || value.displayName : '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Sync internal state if external value changes (e.g. from map selection)
  useEffect(() => {
    if (value && value.displayName) {
      setQuery(value.displayName);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceSearch = setTimeout(async () => {
      // Always compute matching demo locations
      const matchingDemos = query
        ? DEMO_LOCATIONS.filter(d => d.name.toLowerCase().includes(query.toLowerCase()) || d.displayName.toLowerCase().includes(query.toLowerCase()))
        : DEMO_LOCATIONS;

      // Don't search if the query is the currently selected value
      if (query && query.length >= 3 && (!value || query !== value.displayName)) {
        setIsLoading(true);
        const results = await searchLocations(query);
        // Combine demo and real results
        setSuggestions([...matchingDemos, ...results.filter(r => !matchingDemos.find(m => m.name === r.name))]);
        setIsOpen(true);
        setIsLoading(false);
      } else {
        setSuggestions(matchingDemos);
        if (!query) {
          // If query is empty but it's focused, we want to show demo locations
          // The onFocus handler will set isOpen=true
        }
      }
    }, 500);

    return () => clearTimeout(debounceSearch);
  }, [query, value]);

  const handleSelect = (location) => {
    setQuery(location.displayName);
    setIsOpen(false);
    onChange(location);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onChange(null);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-sm font-semibold text-text-primary mb-2">{label}</label>}
      <div className="relative flex items-center">
        <Search className="absolute left-3 text-text-secondary" size={18} />
        <input
          type="text"
          className="w-full pl-10 pr-20 py-3 bg-background border border-border rounded-xl text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null); // Clear selection if typing
          }}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button 
              type="button"
              onClick={handleClear}
              className="p-1 text-text-secondary hover:text-error transition-colors"
            >
              <X size={16} />
            </button>
          )}
          {onMapClick && (
            <button
              type="button"
              onClick={onMapClick}
              className="p-1.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
              title="Select on map"
            >
              <MapPin size={16} />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-text-secondary">Searching...</div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-3 hover:bg-background cursor-pointer flex items-start gap-3 border-b border-border/50 last:border-0"
                >
                  <MapPin size={16} className={item.isDemo ? "text-primary mt-0.5 flex-shrink-0" : "text-text-secondary mt-0.5 flex-shrink-0"} />
                  <div>
                    <div className="text-sm font-medium text-text-primary flex items-center gap-2">
                      {item.name || item.displayName.split(',')[0]}
                      {item.isDemo && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Demo</span>}
                    </div>
                    <div className="text-xs text-text-secondary truncate">{item.displayName}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.length >= 3 ? (
            <div className="p-4 text-center text-sm text-text-secondary">No locations found.</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
