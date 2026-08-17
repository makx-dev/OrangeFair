import React, { useState } from 'react';
import { Route, Users, CarFront, IndianRupee, Loader2 } from 'lucide-react';
import LocationAutocomplete from '../components/FareSplit/LocationAutocomplete';
import { calculateRouteInfo } from '../utils/geoApi';
import axios from '../api/axios';
import FareComparisonCard from '../components/LocalFare/FareComparisonCard';
import SmartAlternativeCard from '../components/LocalFare/SmartAlternativeCard';
import CommunityExperiences from '../components/LocalFare/CommunityExperiences';

const LocalFarePage = () => {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rideType, setRideType] = useState('shared'); // 'private' or 'shared'
  const [driverQuote, setDriverQuote] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [myFarePaid, setMyFarePaid] = useState('');

  const checkLocalFare = async () => {
    if (!pickup || !destination) {
      setError('Please select both pickup and destination locations.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      // First, get distance
      const routeInfo = await calculateRouteInfo([{ lat: pickup.lat, lng: pickup.lng }, { lat: destination.lat, lng: destination.lng }]);
      const distanceKm = routeInfo ? routeInfo.totalDistance : 0;

      // Now fetch estimate
      const response = await axios.get('/local-fare/estimate', {
        params: {
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropLat: destination.lat,
          dropLng: destination.lng,
          rideType,
          distanceKm
        }
      });

      setResult({ ...response.data, distanceKm });
    } catch (err) {
      console.error(err);
      setError('We couldn\'t analyze this route. Local Fare is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!myFarePaid || !pickup || !destination) return;
    
    setIsSubmitting(true);
    try {
      await axios.post('/local-fare/observations', {
        pickupLocation: pickup,
        dropLocation: destination,
        rideType,
        farePaid: Number(myFarePaid),
        distanceKm: result?.distanceKm || 0
      });
      setSubmitSuccess(true);
      // Refresh the estimate
      await checkLocalFare();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight mb-2 flex items-center gap-3">
          <Route className="text-primary" size={32} />
          Local Fare
        </h1>
        <p className="text-text-secondary text-lg">
          Know what people usually pay.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm mb-8 space-y-6">
        <div className="relative">
          <div className="absolute left-5 top-12 bottom-6 w-0.5 bg-border z-0"></div>
          
          <div className="relative z-10 space-y-4">
            <LocationAutocomplete 
              label="From"
              placeholder="Search current location..."
              value={pickup}
              onChange={setPickup}
            />
            
            <LocationAutocomplete 
              label="To"
              placeholder="Search destination..."
              value={destination}
              onChange={setDestination}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-3">How are you travelling?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRideType('private')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                rideType === 'private' 
                  ? 'border-primary bg-primary/10 text-primary-dark shadow-sm' 
                  : 'border-border bg-background text-text-secondary hover:border-text-secondary'
              }`}
            >
              <CarFront size={24} />
              <span className="font-bold text-sm">Private / Single</span>
              <span className="text-xs opacity-70">Entire auto for you</span>
            </button>
            <button
              onClick={() => setRideType('shared')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                rideType === 'shared' 
                  ? 'border-primary bg-primary/10 text-primary-dark shadow-sm' 
                  : 'border-border bg-background text-text-secondary hover:border-text-secondary'
              }`}
            >
              <Users size={24} />
              <span className="font-bold text-sm">Shared / Full-Seater</span>
              <span className="text-xs opacity-70">Sharing the ride</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error/10 text-error rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button 
          onClick={checkLocalFare}
          disabled={!pickup || !destination || isLoading}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <><Loader2 className="animate-spin" size={20} /> Analyzing route data...</>
          ) : (
            'Check Local Fare'
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <hr className="border-border" />
          
          {result.hasData ? (
            <>
              {result.distanceKm > 0 && (
                <div className="text-sm font-medium text-text-secondary text-right">
                  Route distance: {result.distanceKm} km
                </div>
              )}

              {/* Driver Quote Input */}
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
                  What did the driver ask?
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input 
                      type="number"
                      placeholder="Optional"
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-base focus:border-primary outline-none"
                      value={driverQuote}
                      onChange={(e) => setDriverQuote(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <FareComparisonCard 
                stats={result.stats}
                confidence={result.confidence}
                officialFare={result.officialFare}
                isSeeded={result.isSeeded}
                driverQuote={driverQuote}
              />

              <hr className="border-border" />

              <SmartAlternativeCard 
                recommendation={result.metroRecommendation} 
              />

              <CommunityExperiences routeKey={result.routeKey} />

              <hr className="border-border" />

              {/* Contribute Fare */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-text-primary mb-2">Help improve the local estimate</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Report what you paid to help other passengers.
                </p>
                {submitSuccess ? (
                  <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-2">
                    <CircleCheck size={18} />
                    Thanks — your fare helps improve the local estimate!
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                      <input 
                        type="number"
                        placeholder="Fare paid"
                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-base outline-none focus:border-primary"
                        value={myFarePaid}
                        onChange={(e) => setMyFarePaid(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={handleContribute}
                      disabled={isSubmitting || !myFarePaid}
                      className="px-6 py-3 bg-text-primary text-surface font-bold rounded-xl hover:bg-text-secondary transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Add my fare'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Not enough community data yet</h3>
              <p className="text-text-secondary mb-6 max-w-md mx-auto">
                We don't have enough observations for this route to calculate a reliable local fare. 
              </p>
              <div className="bg-background rounded-xl p-6 max-w-sm mx-auto">
                <h4 className="font-bold text-text-primary mb-3">Be the first to contribute</h4>
                <div className="relative mb-3">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="number"
                    placeholder="Fare paid"
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-base outline-none focus:border-primary"
                    value={myFarePaid}
                    onChange={(e) => setMyFarePaid(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleContribute}
                  disabled={isSubmitting || !myFarePaid}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Report what you paid'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalFarePage;
