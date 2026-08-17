import React, { useState } from 'react';
<<<<<<< HEAD
import axios from 'axios';
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
=======
import { splitFare } from '../api/endpoints';
import { Calculator, Plus, X, Users, MapPin, IndianRupee } from 'lucide-react';
>>>>>>> 9bf8930a6a1e080553839ef68eab9eb2304c11d0

const FareSplitPage = () => {
  const [totalFare, setTotalFare] = useState('');
  const [dropPoints, setDropPoints] = useState([
    { rider: 'Passenger 1', startCoords: null, endCoords: null, distance: '' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
<<<<<<< HEAD
  
  // State for the Map Modal
  const [mapModal, setMapModal] = useState({ isOpen: false, passengerIndex: null, type: null });
=======
  const [isLoading, setIsLoading] = useState(false);
>>>>>>> 9bf8930a6a1e080553839ef68eab9eb2304c11d0

  const handleAddRider = () => {
    const newIndex = dropPoints.length + 1;
    setDropPoints([...dropPoints, { rider: `Passenger ${newIndex}`, startCoords: null, endCoords: null, distance: '' }]);
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

  const handleReset = () => {
    setTotalFare('');
    setDropPoints([{ rider: 'Passenger 1', startCoords: null, endCoords: null, distance: '' }]);
    setResults(null);
    setError('');
  };

  const calculateSplit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    setError(''); setResults(null);
=======
    setError('');
    setResults(null);
    setIsLoading(true);
>>>>>>> 9bf8930a6a1e080553839ef68eab9eb2304c11d0

    const payload = {
      totalFare: Number(totalFare),
      passengerCount: dropPoints.length,
      dropPoints: dropPoints.map((p, i) => ({
        rider: p.rider,
        dropPoint: `Drop Point ${i + 1}`,
        distanceFromPickup: Number(p.distance)
      }))
    };

    try {
<<<<<<< HEAD
      const response = await axios.post('http://localhost:5000/api/rides/split', payload);
=======
      const response = await splitFare(payload);
>>>>>>> 9bf8930a6a1e080553839ef68eab9eb2304c11d0
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to calculate fare split.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10 mb-20 relative">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-extrabold text-gray-800">Fair Fare Engine</h1>
      </div>
      
      <form onSubmit={calculateSplit}>
        <div className="mb-6 mt-4">
          <label className="block text-gray-800 font-bold mb-2 text-lg">Total Meter Fare (₹)</label>
          <input type="number" min="1" className="w-full border p-3 rounded-lg" value={totalFare} onChange={(e) => setTotalFare(e.target.value)} required placeholder="e.g. 450" />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Passenger Drop Points</h2>
          <button type="button" className="text-orange-600 bg-orange-100 px-4 py-2 rounded-lg font-bold" onClick={handleAddRider}>+ Add Passenger</button>
        </div>

        <div className="space-y-6">
          {dropPoints.map((point, index) => (
            <div key={index} className="p-4 rounded-lg border shadow-sm">
              <div className="flex justify-between mb-3">
                <input type="text" className="font-bold text-lg border-b outline-none" value={point.rider} onChange={(e) => {
                  const newPoints = [...dropPoints];
                  newPoints[index].rider = e.target.value;
                  setDropPoints(newPoints);
                }} />
                {dropPoints.length > 1 && <button type="button" onClick={() => handleRemoveRider(index)} className="text-red-500 font-bold">✕</button>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded border flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Starting location</p>
                    <p className="font-mono text-xs mb-2">
                      {point.startCoords ? `${point.startCoords.lat.toFixed(4)}, ${point.startCoords.lng.toFixed(4)}` : 'No location selected'}
                    </p>
                  </div>
                  <div>
                    <button type="button" onClick={() => openMap(index, 'start')} className="bg-blue-600 text-white px-3 py-1 text-sm rounded w-full mb-2">Select on map</button>
                    {/* NEW: Copy Previous Location Button */}
                    {index > 0 && dropPoints[index - 1].startCoords && (
                      <button type="button" onClick={() => copyPreviousLocation(index, 'start')} className="text-xs text-orange-600 font-semibold hover:underline w-full text-center">
                        ⤓ Copy {dropPoints[index - 1].rider}'s start
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded border flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ending location</p>
                    <p className="font-mono text-xs mb-2">
                      {point.endCoords ? `${point.endCoords.lat.toFixed(4)}, ${point.endCoords.lng.toFixed(4)}` : 'No location selected'}
                    </p>
                  </div>
                  <div>
                    <button type="button" onClick={() => openMap(index, 'end')} className="bg-blue-600 text-white px-3 py-1 text-sm rounded w-full mb-2">Select on map</button>
                    {/* NEW: Copy Previous Location Button */}
                    {index > 0 && dropPoints[index - 1].endCoords && (
                      <button type="button" onClick={() => copyPreviousLocation(index, 'end')} className="text-xs text-orange-600 font-semibold hover:underline w-full text-center">
                        ⤓ Copy {dropPoints[index - 1].rider}'s end
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm font-semibold">
                Distance: {point.distance ? <span className="text-green-600">{point.distance} km</span> : <span className="text-orange-600">Select both points</span>}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded my-4">{error}</div>}

        <div className="flex gap-4 mt-6">
          <button type="submit" className="flex-1 bg-orange-500 text-white font-extrabold text-lg py-4 px-4 rounded-lg shadow-md hover:bg-orange-600">
            Calculate Fair Split
          </button>
          <button type="button" onClick={handleReset} className="w-1/3 bg-gray-200 text-gray-700 font-extrabold text-lg py-4 px-4 rounded-lg shadow-md hover:bg-gray-300">
            Clear All
          </button>
        </div>
      </form>

      {/* MAP MODAL OVERLAY */}
      {mapModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col justify-end z-50">
          <div className="bg-white p-4 rounded-t-2xl shadow-xl h-2/3 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Choose {mapModal.type === 'start' ? 'starting' : 'ending'} location</h3>
                <p className="text-sm text-gray-500">Click anywhere on the map to drop a pin.</p>
              </div>
              <button onClick={closeMap} className="text-gray-500 text-2xl font-bold">✕</button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button onClick={useCurrentLocation} className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Use my current location</button>
              <button onClick={closeMap} className="border px-4 py-2 rounded font-bold">Cancel</button>
            </div>

            <div className="flex-grow border rounded-lg overflow-hidden">
              <MapContainer center={[21.1458, 79.0882]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker onLocationSelected={handleMapClick} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {results && (
        <div className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
          <h3 className="text-2xl font-black text-green-800 mb-4">Final Split Breakdown</h3>
          <div className="space-y-3">
            {results.perRider.map((res, i) => (
              <div key={i} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-green-100">
                <div>
                  <p className="font-bold">{res.rider}</p>
                  <p className="text-xs text-gray-500">{res.distanceFromPickup} km</p>
=======
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
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
                        className="absolute -right-2 -top-2 w-6 h-6 bg-error text-surface rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                        title="Remove Passenger"
                      >
                        <X size={14} />
                      </button>
                    )}
                    
                    <div className="grid sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
                        <input
                          type="text"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          value={point.rider}
                          onChange={(e) => handlePointChange(index, 'rider', e.target.value)}
                          placeholder="Passenger Name"
                          required
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Drop Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/50" size={14} />
                          <input
                            type="text"
                            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            value={point.dropPoint}
                            onChange={(e) => handlePointChange(index, 'dropPoint', e.target.value)}
                            placeholder="Drop Location"
                            required
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-text-secondary mb-1">Distance (km)</label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                          placeholder="km"
                          value={point.distanceFromPickup}
                          onChange={(e) => handlePointChange(index, 'distanceFromPickup', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3">
                <FileWarning className="text-error shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || dropPoints.length === 0 || !totalFare}
              className="w-full bg-primary hover:bg-primary-dark text-surface font-semibold text-lg py-4 px-6 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
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
>>>>>>> 9bf8930a6a1e080553839ef68eab9eb2304c11d0
                </div>
                <div className="text-xl font-black text-green-600">₹{res.fairShare}</div>
              </div>
<<<<<<< HEAD
            ))}
          </div>
=======
              
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
>>>>>>> 9bf8930a6a1e080553839ef68eab9eb2304c11d0
        </div>
      </div>
    </div>
  );
};

export default FareSplitPage;