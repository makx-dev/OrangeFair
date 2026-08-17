import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { searchLocations } from '../../utils/geoApi';

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
      // Don't search if the query is the currently selected value
      if (query && query.length >= 3 && (!value || query !== value.displayName)) {
        setIsLoading(true);
        const results = await searchLocations(query);
        setSuggestions(results);
        setIsOpen(true);
        setIsLoading(false);
      } else {
        setSuggestions([]);
        if (!query) setIsOpen(false);
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
                  <MapPin size={16} className="text-text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-text-primary">{item.name || item.displayName.split(',')[0]}</div>
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
