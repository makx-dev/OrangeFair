import React, { useState } from 'react';
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

const FareSplitPage = () => {
  const [totalFare, setTotalFare] = useState('');
  const [dropPoints, setDropPoints] = useState([
    { rider: 'Passenger 1', startCoords: null, endCoords: null, distance: '' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  
  // State for the Map Modal
  const [mapModal, setMapModal] = useState({ isOpen: false, passengerIndex: null, type: null });

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
    setError(''); setResults(null);

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
      const response = await axios.post('http://localhost:5000/api/rides/split', payload);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to calculate fare split.");
    }
  };

  return (
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
                </div>
                <div className="text-xl font-black text-green-600">₹{res.fairShare}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FareSplitPage;