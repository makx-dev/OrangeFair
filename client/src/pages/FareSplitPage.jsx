import React, { useState, useEffect } from 'react';
import { splitFare } from '../api/endpoints';
import { Calculator, Plus, X, Users, MapPin, IndianRupee, Map as MapIcon, Info, ArrowUp, ArrowDown, Trash2, CircleCheck, TriangleAlert, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LocationAutocomplete from '../components/FareSplit/LocationAutocomplete';
import { calculateRouteInfo } from '../utils/geoApi';
import { AUTO_FARE_CONFIG, calculateMeterFareAtDistance, isNightTime } from '../utils/tariffConfig';

// Fix for default Leaflet markers not showing up in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks
const LocationPicker = ({ onLocationSelected }) => {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng);
    },
  });
  return null;
};

const FareSplitPage = () => {
  const [pickup, setPickup] = useState(null);
  const [dropPoints, setDropPoints] = useState([
    { id: 1, passengerCount: 1, dropLocation: null },
    { id: 2, passengerCount: 1, dropLocation: null }
  ]);
  const [driverQuotedFare, setDriverQuotedFare] = useState('');
  
  const [routeInfo, setRouteInfo] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Map Modal
  const [mapModal, setMapModal] = useState({ isOpen: false, type: null, pointId: null });

  // Reset results when inputs change
  useEffect(() => {
    setResults(null);
    setRouteInfo(null);
    setError('');
  }, [pickup, dropPoints]);

  const handleAddDestination = () => {
    const newId = Date.now();
    setDropPoints([...dropPoints, { id: newId, passengerCount: 1, dropLocation: null }]);
  };

  const handleRemoveRider = (id) => {
    setDropPoints(dropPoints.filter(p => p.id !== id));
  };

  const movePassenger = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= dropPoints.length) return;
    const updated = [...dropPoints];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setDropPoints(updated);
  };

  const openMap = (type, pointId = null) => {
    setMapModal({ isOpen: true, type, pointId });
  };

  const closeMap = () => {
    setMapModal({ isOpen: false, type: null, pointId: null });
  };

  const handleMapSelection = async (latlng) => {
    const { type, pointId } = mapModal;
    
    // Reverse geocode to get a readable name using Photon
    let displayName = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lon=${latlng.lng}&lat=${latlng.lat}`);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const p = data.features[0].properties;
          displayName = [p.name, p.street, p.locality, p.city, p.state].filter(Boolean).join(', ');
        }
      }
    } catch(err) {
      console.error("Reverse geocoding failed", err);
    }

    const locationObj = {
      name: displayName.split(',')[0],
      displayName,
      lat: latlng.lat,
      lng: latlng.lng
    };

    if (type === 'pickup') {
      setPickup(locationObj);
    } else if (type === 'drop') {
      setDropPoints(dropPoints.map(p => p.id === pointId ? { ...p, dropLocation: locationObj } : p));
    }
    
    closeMap();
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        handleMapSelection({ lat: position.coords.latitude, lng: position.coords.longitude });
      }, () => {
        alert("Could not get your location. Please select on the map.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const calculateSplit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setIsLoading(true);

    if (!pickup) {
      setError("Please select a pickup location.");
      setIsLoading(false);
      return;
    }

    const missingDrops = dropPoints.some(p => !p.dropLocation);
    if (missingDrops) {
      setError("Please select drop locations for all passengers.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Get Route Info from OSRM
      const coordinates = [pickup, ...dropPoints.map(p => p.dropLocation)];
      const routeData = await calculateRouteInfo(coordinates);
      
      if (!routeData) {
        throw new Error("Unable to calculate route between these locations. Please try again.");
      }
      
      setRouteInfo(routeData);

      // 2. Prepare payload for backend
      const payloadPoints = dropPoints.map((p, index) => ({
        passengerCount: Number(p.passengerCount) || 1,
        dropPoint: p.dropLocation.name,
        cumulativeDistance: routeData.distances[index]
      }));

      // 3. Call backend API
      const response = await splitFare({ dropPoints: payloadPoints });
      setResults(response.data);
      
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to calculate fair split.");
    } finally {
      setIsLoading(false);
    }
  };

  const getComparisonStatus = () => {
    if (!results || !driverQuotedFare) return null;
    const quoted = Number(driverQuotedFare);
    const estimated = results.officialFare;
    if (quoted <= estimated) return null;
    
    const diffPercent = ((quoted - estimated) / estimated);
    const difference = quoted - estimated;
    
    if (diffPercent <= AUTO_FARE_CONFIG.thresholds.close) {
      return { type: 'normal', text: 'Close to expected meter fare', icon: CircleCheck, diff: difference, percent: diffPercent };
    } else if (diffPercent <= AUTO_FARE_CONFIG.thresholds.elevated) {
      return { type: 'elevated', text: 'Higher than expected meter fare', icon: Info, diff: difference, percent: diffPercent };
    } else {
      return { type: 'high', text: 'Significantly above expected meter fare', icon: TriangleAlert, diff: difference, percent: diffPercent };
    }
  };

  const status = getComparisonStatus();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Calculator className="text-primary" size={32} />
          Fair Fare Calculator
        </h1>
        <p className="text-text-secondary">Calculate the official meter estimate and fairly split it among passengers.</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          <form onSubmit={calculateSplit} className="space-y-6">
            
            {/* Step 1: Starting Point */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="bg-primary text-surface w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Starting Point
              </h2>
              <LocationAutocomplete 
                placeholder="Search pickup location..."
                value={pickup}
                onChange={setPickup}
                onMapClick={() => openMap('pickup')}
              />
            </div>

            {/* Step 2: Passenger Drop Points */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <span className="bg-primary text-surface w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                  Destination Drop Points
                </h2>
              </div>
              
              <div className="space-y-4">
                {dropPoints.map((point, index) => (
                  <div key={point.id} className="p-4 border border-border bg-background rounded-xl relative group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-text-secondary" />
                        <input
                          type="number"
                          min="1"
                          className="bg-transparent border-b border-border/50 px-1 py-1 text-sm font-bold text-text-primary focus:border-primary focus:outline-none w-12 text-center"
                          value={point.passengerCount}
                          onChange={(e) => setDropPoints(dropPoints.map(p => p.id === point.id ? { ...p, passengerCount: parseInt(e.target.value) || '' } : p))}
                          required
                        />
                        <span className="text-sm font-medium text-text-secondary">passengers offboarding here</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => movePassenger(index, -1)} disabled={index === 0} className="p-1 text-text-secondary hover:text-primary disabled:opacity-30"><ArrowUp size={16} /></button>
                        <button type="button" onClick={() => movePassenger(index, 1)} disabled={index === dropPoints.length - 1} className="p-1 text-text-secondary hover:text-primary disabled:opacity-30"><ArrowDown size={16} /></button>
                        <button type="button" onClick={() => handleRemoveRider(point.id)} disabled={dropPoints.length <= 1} className="p-1 text-error/70 hover:text-error disabled:opacity-30 ml-2"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <LocationAutocomplete 
                      placeholder="Search destination..."
                      value={point.dropLocation}
                      onChange={(loc) => setDropPoints(dropPoints.map(p => p.id === point.id ? { ...p, dropLocation: loc } : p))}
                      onMapClick={() => openMap('drop', point.id)}
                    />
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={handleAddDestination}
                className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors py-2"
              >
                <Plus size={16} />
                Add destination
              </button>
            </div>

            {/* Step 3: Optional Driver Quote */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">?</span>
                What did the driver ask you to pay? <span className="text-text-secondary text-sm font-normal">(Optional)</span>
              </h2>
              <div className="relative mt-4">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input
                  type="number"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. 250"
                  value={driverQuotedFare}
                  onChange={(e) => setDriverQuotedFare(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 text-error text-sm font-medium">
                <TriangleAlert size={18} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !pickup || dropPoints.some(p => !p.dropLocation)}
              className="w-full bg-primary hover:bg-primary-dark text-surface font-semibold text-lg py-4 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-sm"
            >
              {isLoading ? 'Calculating route and fare...' : 'Calculate Fair Split'}
            </button>
          </form>
        </div>

        {/* Right Column - Results */}
        <div>
          {results ? (
            <div className="space-y-6">
              
              {/* Route Visualization */}
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Route</h3>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border"></div>
                  
                  <div className="relative mb-6">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
                    <p className="font-bold text-text-primary text-sm">{pickup.name}</p>
                    <p className="text-xs text-text-secondary mt-1">Starting point</p>
                  </div>
                  
                  {results.perDestination.map((dest, i) => (
                    <div key={i} className="relative mb-6 last:mb-0">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-primary bg-surface"></div>
                      <p className="font-bold text-text-primary text-sm">{dest.dropPoint}</p>
                      <div className="text-xs text-text-secondary mt-1 flex justify-between">
                        <span>Drop {i + 1} ({dest.distanceFromPickup} km)</span>
                        <span>{dest.passengerCount} passenger{dest.passengerCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* A. Official Fare */}
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Official Fare</h3>
                <div>
                  <p className="text-text-secondary text-sm">Estimated Meter Fare</p>
                  <p className="text-3xl font-bold text-primary mt-1">₹{results.officialFare}</p>
                </div>
                <div className="mt-4 text-xs text-text-secondary bg-background p-2 rounded inline-block">
                  Based on Maharashtra Motor Vehicle Department tariff
                </div>
              </div>

              {/* B. Driver Comparison */}
              {driverQuotedFare && status && (
                <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Driver Comparison</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-text-secondary">Driver quoted</p>
                      <p className="font-bold">₹{driverQuotedFare}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary">Expected</p>
                      <p className="font-bold">₹{results.officialFare}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border">
                      <p className="text-text-secondary inline-block w-24">Difference</p>
                      <span className="font-bold text-error">+₹{status.diff}</span>
                      <span className="text-text-secondary ml-2">({(status.percent * 100).toFixed(1)}% higher)</span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
                    status.type === 'normal' ? 'bg-success/10 text-success' : 
                    status.type === 'elevated' ? 'bg-warning/10 text-warning' : 
                    'bg-error/10 text-error'
                  }`}>
                    <status.icon size={18} />
                    {status.type === 'high' ? 'Significantly above expected meter fare' : status.text}
                  </div>
                  <p className="text-xs text-text-secondary mt-3">
                    Comparison is an estimate based on published meter tariff and route distance. Actual charges may vary due to applicable tariff conditions.
                  </p>
                </div>
              )}

              {/* C. Fair Passenger Split */}
              <div className="bg-success/5 border border-success/20 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-success uppercase tracking-wider mb-4">Fair Passenger Split</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 text-xs font-semibold text-success/70 pb-2 border-b border-success/10">
                    <div className="col-span-6">Destination</div>
                    <div className="col-span-3 text-right">Per Person</div>
                    <div className="col-span-3 text-right">Group Total</div>
                  </div>
                  
                  {results.perDestination.map((res, i) => (
                    <div key={i} className="grid grid-cols-12 items-center py-2 border-b border-success/10 last:border-0">
                      <div className="col-span-6">
                        <div className="font-semibold text-text-primary truncate pr-2 text-sm">{res.dropPoint}</div>
                        <div className="text-xs text-text-secondary mt-0.5">{res.passengerCount} passenger{res.passengerCount > 1 ? 's' : ''}</div>
                      </div>
                      <div className="col-span-3 text-right font-medium text-success/80 text-sm">
                        ₹{res.fairSharePerPerson}
                      </div>
                      <div className="col-span-3 text-right font-bold text-success text-base">
                        ₹{res.groupFairShare}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-background border border-border border-dashed rounded-2xl p-8 h-full min-h-[300px] flex flex-col items-center justify-center text-center text-text-secondary">
              <Calculator size={48} className="text-border mb-4 opacity-50" />
              <p className="font-medium">No calculation yet</p>
              <p className="text-sm mt-2 max-w-xs">Enter your starting point and drop locations to calculate the official fair fare split.</p>
            </div>
          )}
        </div>
      </div>

      {/* MAP MODAL OVERLAY */}
      {mapModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-surface p-6 rounded-t-3xl shadow-xl h-[75vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">
                  Choose {mapModal.type === 'pickup' ? 'pickup' : 'drop'} location
                </h3>
                <p className="text-sm text-text-secondary mt-1">Click anywhere on the map to drop a pin.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={useCurrentLocation} 
                  className="px-4 py-2 bg-primary text-surface rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-dark transition-colors text-sm"
                >
                  <Crosshair size={16} />
                  Use my location
                </button>
                <button 
                  onClick={closeMap} 
                  className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-grow border border-border rounded-2xl overflow-hidden relative z-0">
              <MapContainer center={[21.1458, 79.0882]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker onLocationSelected={handleMapSelection} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FareSplitPage;