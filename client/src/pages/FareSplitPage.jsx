import React, { useState } from 'react';
import { splitFare } from '../api/endpoints';
import { Calculator, Plus, X, Users, MapPin, IndianRupee } from 'lucide-react';

const FareSplitPage = () => {
  const [totalFare, setTotalFare] = useState('');
  const [dropPoints, setDropPoints] = useState([
    { rider: 'Passenger 1', dropPoint: 'Location A', distanceFromPickup: '' }
  ]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

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
      const response = await splitFare(payload);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to calculate fare split.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
    </div>
  );
};

export default FareSplitPage;