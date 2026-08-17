import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TrustBadge from '../components/TrustBadge';
import { getPlate } from '../api/endpoints';
import { Shield, MessageSquare, IndianRupee, AlertTriangle, Car, Plus } from 'lucide-react';

export default function PlateDetailPage() {
  const { plateNumber } = useParams();
  const [plate, setPlate] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlate = async () => {
      setIsLoading(true);
      try {
        const response = await getPlate(plateNumber);
        setPlate(response.data);
        setError('');
      } catch {
        setError('Could not load plate data. The auto registration might not exist in our database yet.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlate();
  }, [plateNumber]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-text-secondary">Loading auto details...</p>
      </div>
    );
  }

  if (error || !plate) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-error/10 border border-error/20 rounded-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <AlertTriangle className="mx-auto text-error mb-4" size={48} />
        <h2 className="text-xl font-bold text-text-primary mb-2">Not Found</h2>
        <p className="text-text-secondary mb-6">{error}</p>
        <button
          onClick={() => navigate('/search')}
          className="bg-surface border border-border px-6 py-2.5 rounded-lg text-text-primary font-medium hover:border-primary/50 hover:bg-background transition-colors"
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-text-secondary tracking-wider uppercase mb-1">Auto Registration</p>
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary tracking-wide">
            {plate.plateNumber}
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <TrustBadge tier={plate.trustTier} score={plate.trustScore} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content - Left */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Fair Fare Estimate */}
          {plate.fairFareEstimate && (
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="border-b border-border p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
                  <IndianRupee size={20} />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Fair Fare Estimate</h2>
              </div>
              <div className="p-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-text-primary">₹{plate.fairFareEstimate.estimatedMin}</span>
                  <span className="text-xl text-text-secondary font-medium">to</span>
                  <span className="text-4xl font-bold text-text-primary">₹{plate.fairFareEstimate.estimatedMax}</span>
                </div>
                <p className="text-sm text-text-secondary bg-background rounded-lg p-3 inline-block border border-border">
                  {plate.fairFareEstimate.note}
                </p>
              </div>
            </section>
          )}

          {/* Comments/Observations */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="border-b border-border p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary-dark">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Community Observations</h2>
            </div>
            
            <div className="p-6">
              {plate.recentComments && plate.recentComments.length > 0 ? (
                <div className="space-y-4">
                  {plate.recentComments.map((comment) => (
                    <div key={comment._id} className="bg-background border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 bg-surface border border-border rounded-md text-xs font-semibold text-text-secondary uppercase tracking-wider">
                          {comment.tag}
                        </span>
                        <span className="text-xs text-text-secondary">
                          By {comment.riderId?.name || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-text-primary">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto text-text-secondary/50 mb-3" />
                  <p className="text-text-primary font-medium">No observations yet</p>
                  <p className="text-sm text-text-secondary mt-1">Be the first to share your experience with this auto.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">
            Actions
          </h3>
          
          <button 
            onClick={() => navigate(`/log-ride?plate=${plate.plateNumber}`)}
            className="w-full bg-success/10 hover:bg-success border-success hover:border-success/90 text-success hover:text-surface border rounded-xl p-4 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center group-hover:bg-surface/20 transition-colors">
              <Car size={20} />
            </div>
            <div className="text-left font-medium">
              Log a Ride
            </div>
          </button>

          <button 
            onClick={() => navigate(`/reports?plate=${plate.plateNumber}`)}
            className="w-full bg-error/10 hover:bg-error border-error hover:border-error/90 text-error hover:text-surface border rounded-xl p-4 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center group-hover:bg-surface/20 transition-colors">
              <AlertTriangle size={20} />
            </div>
            <div className="text-left font-medium">
              Report Issue
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
