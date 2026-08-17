import React from 'react';
import { IndianRupee, Users, TriangleAlert, BadgeCheck, CarFront } from 'lucide-react';

const FareComparisonCard = ({ 
  stats, 
  confidence, 
  officialFare, 
  isSeeded, 
  driverQuote 
}) => {
  if (!stats) return null;

  // Determine Driver Quote status
  let quoteStatus = null;
  let quoteMessage = null;
  let QuoteIcon = null;

  if (driverQuote) {
    const quote = Number(driverQuote);
    if (quote <= stats.upperRange) {
      quoteStatus = 'success';
      quoteMessage = '✓ Within the typical local range';
    } else if (quote <= stats.upperRange + 15) {
      quoteStatus = 'warning';
      quoteMessage = '⚠ Near or slightly above the upper end of the local range';
    } else {
      quoteStatus = 'danger';
      quoteMessage = '⚠ Significantly above the community range';
    }
  }

  return (
    <div className="space-y-6">
      {/* Local Fare */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Visual ribbon */}
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Local Fare
          </h3>
          {isSeeded && (
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md">
              Prototype data
            </span>
          )}
        </div>
        
        <div className="flex items-end gap-3 mb-2">
          <span className="text-4xl font-black text-primary-dark">
            ₹{stats.lowerRange}–{stats.upperRange}
          </span>
        </div>
        
        <p className="text-lg font-medium text-text-primary mb-6">
          Typical: ₹{stats.median}
        </p>

        <div className="flex items-center gap-2 text-sm text-text-secondary bg-background/50 rounded-lg p-3 inline-flex">
          <Users size={16} className={confidence === 'High confidence' ? 'text-green-500' : 'text-yellow-500'} />
          <span className="font-medium">
            {stats.sampleSize} {isSeeded ? 'sample observations' : 'community observations'}
          </span>
          <span className="mx-2 opacity-30">•</span>
          <span className="font-medium text-text-primary">
            {confidence}
          </span>
        </div>
        
        <p className="text-xs text-text-secondary mt-4">
          Local fares reflect what passengers are commonly paying on this route.
        </p>
      </div>

      {/* Driver Quote Comparison */}
      {driverQuote && (
        <div className={`bg-surface border rounded-2xl p-6 shadow-sm relative overflow-hidden
          ${quoteStatus === 'success' ? 'border-green-200' : 
            quoteStatus === 'warning' ? 'border-yellow-200' : 'border-error/30'}
        `}>
          {quoteStatus === 'danger' && <div className="absolute top-0 left-0 w-1 h-full bg-error" />}
          {quoteStatus === 'success' && <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />}
          
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
            Driver Quote
          </h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-text-primary">₹{driverQuote}</span>
          </div>
          
          <div className={`p-3 rounded-lg text-sm font-medium
            ${quoteStatus === 'success' ? 'bg-green-50 text-green-700' : 
              quoteStatus === 'warning' ? 'bg-yellow-50 text-yellow-700' : 
              'bg-error/10 text-error'}
          `}>
            {quoteMessage}
          </div>
        </div>
      )}

      {/* Official Meter */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden opacity-90">
        <div className="absolute top-0 left-0 w-1 h-full bg-text-secondary" />
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
          Official Meter
        </h3>
        <p className="text-2xl font-bold text-text-primary mb-2">
          ₹{officialFare}
        </p>
        <p className="text-xs text-text-secondary">
          Tariff-based reference. May differ from negotiated local fares.
        </p>
      </div>
    </div>
  );
};

export default FareComparisonCard;
