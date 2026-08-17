import React, { useState } from 'react';
import { splitFare } from '../api/endpoints';
import { Calculator, Plus, X, Users, MapPin, IndianRupee, Map as MapIcon, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers not showing up in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Math formula to calculate real-world distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return '';
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

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
  const [totalFare, setTotalFare] = useState('');
  const [dropPoints, setDropPoints] = useState([
    { rider: 'Passenger 1', dropPoint: 'Drop Point 1', startCoords: null, endCoords: null, distance: '' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for the Map Modal
  const [mapModal, setMapModal] = useState({ isOpen: false, passengerIndex: null, type: null });

  const handleAddRider = () => {
    const newIndex = dropPoints.length + 1;
    setDropPoints([...dropPoints, { rider: `Passenger ${newIndex}`, dropPoint: `Drop Point ${newIndex}`, startCoords: null, endCoords: null, distance: '' }]);
  };

  const handlePointChange = (index, field, value) => {
    const updatedPoints = [...dropPoints];
    updatedPoints[index][field] = value;
    setDropPoints(updatedPoints);
  };

  const handleRemoveRider = (index) => {
    setDropPoints(dropPoints.filter((_, i) => i !== index));
  };

  const openMap = (index, type) => {
    setMapModal({ isOpen: true, passengerIndex: index, type: type });
  };

  const closeMap = () => {
    setMapModal({ isOpen: false, passengerIndex: null, type: null });
  };

  const handleMapClick = (latlng) => {
    const { passengerIndex, type } = mapModal;
    const updatedPoints = [...dropPoints];
    const point = updatedPoints[passengerIndex];

    if (type === 'start') point.startCoords = latlng;
    if (type === 'end') point.endCoords = latlng;

    // Auto-calculate distance if both points exist
    if (point.startCoords && point.endCoords) {
      point.distance = calculateDistance(
        point.startCoords.lat, point.startCoords.lng,
        point.endCoords.lat, point.endCoords.lng
      );
    }

    setDropPoints(updatedPoints);
    closeMap();
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        handleMapClick({ lat: position.coords.latitude, lng: position.coords.longitude });
      }, () => {
        alert("Could not get your location. Please select on the map.");
      });
    }
  };

  // --- NEW: Copy Previous Location Function ---
  const copyPreviousLocation = (currentIndex, type) => {
    if (currentIndex === 0) return; // Passenger 1 has no previous passenger
    
    const updatedPoints = [...dropPoints];
    const previousPoint = updatedPoints[currentIndex - 1];
    const currentPoint = updatedPoints[currentIndex];

    if (type === 'start' && previousPoint.startCoords) {
      currentPoint.startCoords = previousPoint.startCoords;
    }
    
    if (type === 'end' && previousPoint.endCoords) {
      currentPoint.endCoords = previousPoint.endCoords;
    }

    // Auto-calculate distance if both points exist
    if (currentPoint.startCoords && currentPoint.endCoords) {
      currentPoint.distance = calculateDistance(
        currentPoint.startCoords.lat, currentPoint.startCoords.lng,
        currentPoint.endCoords.lat, currentPoint.endCoords.lng
      );
    }

    setDropPoints(updatedPoints);
  };

  const calculateSplit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setIsLoading(true);

    const payload = {
      totalFare: Number(totalFare),
      passengerCount: dropPoints.length,
      dropPoints: dropPoints.map((p, i) => ({
        rider: p.rider,
        dropPoint: p.dropPoint || `Drop Point ${i + 1}`,
        distanceFromPickup: Number(p.distance)
      }))
    };

    try {
      const response = await splitFare(payload);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to calculate fare split.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <Calculator className="text-primary" size={32} />
          Fair Fare Split
        </h1>
        <p className="text-text-secondary">Split a shared auto fare fairly based on each passenger's travel distance.</p>
      </div>
      
      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={calculateSplit} className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
            
            {/* Total Fare */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Total Meter Fare (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-lg font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={totalFare}
                  onChange={(e) => setTotalFare(e.target.value)}
                  required
                  placeholder="e.g. 150"
                />
              </div>
            </div>

            {/* Passengers */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Users size={20} className="text-text-secondary" />
                  Passengers
                </h2>
                <button
                  type="button"
                  onClick={handleAddRider}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
                >
                  <Plus size={16} />
                  Add Passenger
                </button>
              </div>

              <div className="space-y-4">
                {dropPoints.map((point, index) => (
                  <div key={index} className="bg-background border border-border rounded-xl p-4 relative group">
                    {dropPoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRider(index)}
                        className="absolute -right-2 -top-2 w-6 h-6 bg-error text-surface rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm z-10"
                        title="Remove Passenger"
                      >
                        <X size={14} />
                      </button>
                    )}
                    
                    <div className="flex flex-col gap-4">
                      {/* Name input */}
                      <div>
                        <input
                          type="text"
                          className="w-full bg-transparent border-b border-border/50 px-1 py-1 text-lg font-bold text-text-primary focus:border-primary focus:outline-none transition-all"
                          value={point.rider}
                          onChange={(e) => handlePointChange(index, 'rider', e.target.value)}
                          placeholder="Passenger Name"
                          required
                        />
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Start Location */}
                        <div className="bg-surface border border-border rounded-lg p-3 flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-semibold text-text-secondary mb-1">Pickup Location</p>
                            <p className="font-mono text-xs text-text-primary mb-3 bg-background p-1.5 rounded border border-border/50">
                              {point.startCoords ? `${point.startCoords.lat.toFixed(4)}, ${point.startCoords.lng.toFixed(4)}` : 'Not selected'}
                            </p>
                          </div>
                          <div>
                            <button 
                              type="button" 
                              onClick={() => openMap(index, 'start')} 
                              className="w-full bg-primary/10 text-primary font-medium px-3 py-1.5 text-sm rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 mb-2"
                            >
                              <MapIcon size={14} />
                              Select on map
                            </button>
                            {index > 0 && dropPoints[index - 1].startCoords && (
                              <button 
                                type="button" 
                                onClick={() => copyPreviousLocation(index, 'start')} 
                                className="w-full text-xs text-primary font-medium hover:underline flex items-center justify-center gap-1"
                              >
                                ⤓ Copy {dropPoints[index - 1].rider}'s pickup
                              </button>
                            )}
                          </div>
                        </div>

                        {/* End Location */}
                        <div className="bg-surface border border-border rounded-lg p-3 flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-semibold text-text-secondary mb-1">Drop Location</p>
                            <p className="font-mono text-xs text-text-primary mb-3 bg-background p-1.5 rounded border border-border/50">
                              {point.endCoords ? `${point.endCoords.lat.toFixed(4)}, ${point.endCoords.lng.toFixed(4)}` : 'Not selected'}
                            </p>
                          </div>
                          <div>
                            <button 
                              type="button" 
                              onClick={() => openMap(index, 'end')} 
                              className="w-full bg-primary/10 text-primary font-medium px-3 py-1.5 text-sm rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 mb-2"
                            >
                              <MapIcon size={14} />
                              Select on map
                            </button>
                            {index > 0 && dropPoints[index - 1].endCoords && (
                              <button 
                                type="button" 
                                onClick={() => copyPreviousLocation(index, 'end')} 
                                className="w-full text-xs text-primary font-medium hover:underline flex items-center justify-center gap-1"
                              >
                                ⤓ Copy {dropPoints[index - 1].rider}'s drop
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Distance */}
                      <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-semibold text-text-secondary">Distance</span>
                        {point.distance ? (
                          <span className="text-success font-bold">{point.distance} km</span>
                        ) : (
                          <span className="text-error text-xs font-medium bg-error/10 px-2 py-0.5 rounded">Select both points</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
                <span className="text-error font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || dropPoints.length === 0 || !totalFare || dropPoints.some(p => !p.distance)}
              className="w-full bg-primary hover:bg-primary-dark text-surface font-semibold text-lg py-4 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm"
            >
              {isLoading ? 'Calculating...' : 'Calculate Split'}
            </button>
          </form>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {results ? (
            <div className="bg-success/5 border border-success/20 rounded-2xl p-6 md:p-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-success/20">
                <h3 className="text-xl font-bold text-success">Split Summary</h3>
                <div className="bg-success text-surface text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                  Total: ₹{results.totalAssigned}
                </div>
              </div>
              
              <div className="space-y-1 mb-6">
                <div className="grid grid-cols-12 text-xs font-semibold text-success/70 uppercase tracking-wider px-4 pb-2">
                  <div className="col-span-4">Passenger</div>
                  <div className="col-span-5">Distance</div>
                  <div className="col-span-3 text-right">Share</div>
                </div>
                
                {results.perRider.map((res, i) => (
                  <div key={i} className="grid grid-cols-12 items-center bg-surface p-4 rounded-xl border border-success/10 shadow-sm">
                    <div className="col-span-4 font-semibold text-text-primary truncate pr-2">
                      {res.rider}
                    </div>
                    <div className="col-span-5 text-sm text-text-secondary truncate pr-2">
                      {res.distanceFromPickup} km
                    </div>
                    <div className="col-span-3 text-right font-bold text-success text-lg">
                      ₹{res.fairShare}
                    </div>
                  </div>
                ))}
              </div>

              {results.note && (
                <div className="text-xs text-success/80 bg-success/10 p-3 rounded-lg">
                  {results.note}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-background border border-border border-dashed rounded-2xl p-8 h-full min-h-[300px] flex flex-col items-center justify-center text-center text-text-secondary">
              <Calculator size={48} className="text-border mb-4 opacity-50" />
              <p className="font-medium">No results yet</p>
              <p className="text-sm mt-1">Fill out the form and click calculate to see the fare split.</p>
            </div>
          )}
        </div>
      </div>

      {/* MAP MODAL OVERLAY */}
      {mapModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-surface p-6 rounded-t-3xl shadow-xl h-[75vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-text-primary">
                  Choose {mapModal.type === 'start' ? 'pickup' : 'drop'} location
                </h3>
                <p className="text-sm text-text-secondary mt-1">Click anywhere on the map to drop a pin.</p>
              </div>
              <button 
                onClick={closeMap} 
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary hover:bg-error/10 hover:text-error hover:border-error/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex gap-3 mb-4">
              <button 
                onClick={useCurrentLocation} 
                className="bg-primary text-surface px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-dark transition-colors"
              >
                <Crosshair size={18} />
                Use my location
              </button>
              <button 
                onClick={closeMap} 
                className="bg-background border border-border text-text-primary px-5 py-2.5 rounded-xl font-semibold hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="flex-grow border border-border rounded-2xl overflow-hidden shadow-inner relative z-0">
              <MapContainer center={[21.1458, 79.0882]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker onLocationSelected={handleMapClick} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FareSplitPage;