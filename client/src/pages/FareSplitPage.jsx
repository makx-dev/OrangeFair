import React, { useState } from 'react';
import axios from 'axios';

const FareSplitPage = () => {
  const [totalFare, setTotalFare] = useState('');
  const [dropPoints, setDropPoints] = useState([
    { rider: 'Passenger 1', dropPoint: 'Location A', distanceFromPickup: '' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAddRider = () => {
    const newIndex = dropPoints.length + 1;
    setDropPoints([
      ...dropPoints, 
      { rider: `Passenger ${newIndex}`, dropPoint: `Location ${String.fromCharCode(64 + newIndex)}`, distanceFromPickup: '' }
    ]);
  };

  const handlePointChange = (index, field, value) => {
    const updatedPoints = [...dropPoints];
    updatedPoints[index][field] = value;
    setDropPoints(updatedPoints);
  };

  const handleRemoveRider = (index) => {
    const updatedPoints = dropPoints.filter((_, i) => i !== index);
    setDropPoints(updatedPoints);
  };

  const calculateSplit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    // Format the payload exactly as the backend expects
    const payload = {
      totalFare: Number(totalFare),
      passengerCount: dropPoints.length,
      dropPoints: dropPoints.map(p => ({
        rider: p.rider,
        dropPoint: p.dropPoint,
        distanceFromPickup: Number(p.distanceFromPickup)
      }))
    };

    try {
      // Calls your updated backend route
      const response = await axios.post('http://localhost:5000/api/rides/split', payload);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to calculate fare split.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10 border-t-4 border-orange-500">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Fair Fare Engine</h1>
      <p className="text-gray-500 mb-8">Calculate proportional splits based on distance.</p>
      
      <form onSubmit={calculateSplit}>
        <div className="mb-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
          <label className="block text-orange-800 font-bold mb-2 text-lg">Total Meter Fare (₹)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            className="w-full md:w-1/2 border border-orange-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={totalFare}
            onChange={(e) => setTotalFare(e.target.value)}
            required
            placeholder="e.g. 450"
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700">Passenger Drop Points</h2>
            <button
              type="button"
              className="text-orange-600 font-bold bg-orange-100 hover:bg-orange-200 px-4 py-2 rounded-lg transition"
              onClick={handleAddRider}
            >
              + Add Passenger
            </button>
          </div>

          <div className="space-y-4">
            {dropPoints.map((point, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <input
                  type="text"
                  className="w-full md:w-1/3 border border-gray-300 rounded p-2 focus:outline-none focus:border-orange-500"
                  value={point.rider}
                  onChange={(e) => handlePointChange(index, 'rider', e.target.value)}
                  placeholder="Passenger Name"
                  required
                />
                <input
                  type="text"
                  className="w-full md:w-1/3 border border-gray-300 rounded p-2 focus:outline-none focus:border-orange-500"
                  value={point.dropPoint}
                  onChange={(e) => handlePointChange(index, 'dropPoint', e.target.value)}
                  placeholder="Drop Location"
                  required
                />
                <div className="w-full md:w-1/3 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-orange-500"
                    placeholder="Distance (km)"
                    value={point.distanceFromPickup}
                    onChange={(e) => handlePointChange(index, 'distanceFromPickup', e.target.value)}
                    required
                  />
                  {dropPoints.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded font-bold"
                      onClick={() => handleRemoveRider(index)}
                      title="Remove Rider"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-6 font-semibold">{error}</div>}

        <button
          type="submit"
          className="w-full bg-orange-500 text-white font-extrabold text-lg py-4 px-4 rounded-lg hover:bg-orange-600 transition shadow-md"
        >
          Calculate Fair Split
        </button>
      </form>

      {/* --- RESULTS DISPLAY --- */}
      {results && (
        <div className="mt-10 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-green-800">Final Split Breakdown</h3>
            <span className="bg-green-200 text-green-900 text-sm font-bold px-3 py-1 rounded-full">
              Total: ₹{results.totalAssigned}
            </span>
          </div>
          
          <div className="space-y-3 mb-6">
            {results.perRider.map((res, i) => (
              <div key={i} className="flex justify-between items-center bg-white p-4 rounded shadow-sm border border-green-100">
                <div>
                  <p className="font-bold text-gray-800 text-lg">{res.rider}</p>
                  <p className="text-sm text-gray-500">Drop: {res.dropPoint} • {res.distanceFromPickup} km</p>
                </div>
                <div className="text-2xl font-black text-green-600">
                  ₹{res.fairShare}
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm text-green-700 italic border-t border-green-200 pt-4">
            * {results.note}
          </div>
        </div>
      )}
    </div>
  );
};

export default FareSplitPage;