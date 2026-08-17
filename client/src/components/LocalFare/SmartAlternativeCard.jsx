import React from 'react';
import { TrainFront, Clock, IndianRupee, CarFront } from 'lucide-react';

const SmartAlternativeCard = ({ recommendation }) => {
  if (!recommendation) {
    return null;
  }

  if (!recommendation.isPractical) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm mb-8 text-center text-text-secondary">
        <p className="text-sm">No practical Metro connection found for this route.</p>
      </div>
    );
  }

  const {
    alternativeCost,
    saving,
    totalAlternativeTime,
    autoTime,
    firstMileMode,
    lastMileMode,
    isFaster
  } = recommendation;

  if (saving <= 0 && !isFaster) {
    // Auto is strictly better or equal (cheaper and faster)
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm mb-8 text-text-secondary">
        <p className="text-sm font-medium mb-2">Auto is currently the more practical option.</p>
        <p className="text-xs">
          Estimated: <br/>
          ₹{alternativeCost + saving} <br/>
          ~{autoTime} min
        </p>
      </div>
    );
  }


  // Determine what to display for metro label based on modes
  let metroLabel = 'Metro';
  if (firstMileMode === 'walk' && lastMileMode === 'walk') {
    metroLabel = 'Metro + Walk';
  } else if (firstMileMode === 'auto' || lastMileMode === 'auto') {
    metroLabel = 'Metro + last-mile auto';
  }

  return (
    <div className="bg-surface border-2 border-primary/20 rounded-2xl p-6 shadow-sm mb-8 overflow-hidden relative">
      {/* Visual background element */}
      <div className="absolute -right-10 -top-10 text-primary/5">
        <TrainFront size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <TrainFront className="text-primary" size={24} />
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Smart Alternative
          </h3>
        </div>

        {saving > 0 ? (
          <h4 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            Metro could save you ₹{saving}
          </h4>
        ) : (
          <h4 className="text-xl font-bold text-text-primary mb-6">
            Metro is a viable alternative
          </h4>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Metro Card */}
          <div className={`p-4 rounded-xl border ${saving > 0 ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm uppercase tracking-wider text-text-secondary">
                {saving > 0 ? 'Best Value' : 'Alternative'}
              </span>
              <TrainFront size={16} className="text-text-secondary" />
            </div>
            
            <div className="font-semibold text-text-primary mb-1">
              {metroLabel}
            </div>
            <div className="text-2xl font-black text-primary-dark mb-1">
              ₹{alternativeCost}
            </div>
            <div className="text-sm text-text-secondary flex items-center gap-1">
              <Clock size={14} />
              ~{totalAlternativeTime} min
            </div>
          </div>

          {/* Auto Card */}
          <div className={`p-4 rounded-xl border ${isFaster ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm uppercase tracking-wider text-text-secondary">
                {isFaster ? 'Fastest' : 'Auto'}
              </span>
              <CarFront size={16} className="text-text-secondary" />
            </div>
            
            <div className="font-semibold text-text-primary mb-1">
              Local Auto
            </div>
            <div className="text-2xl font-black text-text-primary mb-1">
              ₹{alternativeCost + saving}
            </div>
            <div className="text-sm text-text-secondary flex items-center gap-1">
              <Clock size={14} />
              ~{autoTime} min
            </div>
          </div>

        </div>

        {/* Tradeoff Summary */}
        <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm font-medium">
          {saving > 0 ? (
            <span className="text-green-600 font-bold">Save ₹{saving}</span>
          ) : (
            <span className="text-text-secondary">Comparable cost</span>
          )}
          
          {!isFaster && (
            <span className="text-text-secondary">
              Take ~{totalAlternativeTime - autoTime} extra minutes
            </span>
          )}
          {isFaster && (
            <span className="text-primary font-bold">
              Save ~{autoTime - totalAlternativeTime} minutes
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartAlternativeCard;
