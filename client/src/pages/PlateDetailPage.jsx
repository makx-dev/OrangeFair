import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TrustBadge from '../components/TrustBadge';
import { getPlate } from '../api/endpoints';
import { 
  Shield, MessageSquare, IndianRupee, AlertTriangle, Car, 
  BadgeCheck, ShieldCheck, Clock, FileCheck 
} from 'lucide-react';

export default function PlateDetailPage() {
  const { plateNumber } = useParams();
  const [plateData, setPlateData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlate = async () => {
      setIsLoading(true);
      try {
        const response = await getPlate(plateNumber);
        setPlateData(response.data);
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
        <p className="text-text-secondary">Loading verified auto profile...</p>
      </div>
    );
  }

  if (error || !plateData) {
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

  const { vehicle, verification, trust, recentComments, fairFareEstimate } = plateData;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Section: Official Verification */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className={`p-4 md:p-6 text-white flex items-center gap-3 ${verification.verified ? 'bg-success' : 'bg-surface border-b border-border text-text-primary'}`}>
          {verification.verified ? (
            <>
              <BadgeCheck size={28} className="text-white" />
              <h2 className="text-xl md:text-2xl font-bold tracking-wide flex-1">RC VERIFIED</h2>
            </>
          ) : (
            <>
              <FileCheck size={28} className="text-text-secondary" />
              <h2 className="text-xl md:text-2xl font-bold tracking-wide flex-1 text-text-primary">VEHICLE PROFILE</h2>
            </>
          )}
        </div>
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-wider mb-2">
              {vehicle.registrationNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-lg font-medium text-text-secondary">
              <span className="flex items-center gap-2"><Car size={20} /> {vehicle.vehicleType || 'Auto Rickshaw'}</span>
              <span>•</span>
              <span>{vehicle.fuelType || 'CNG'}</span>
            </div>
          </div>
          
          <div className="text-sm text-text-secondary flex flex-col items-start md:items-end gap-1">
            <span className="bg-background border border-border px-3 py-1 rounded-md text-xs font-semibold uppercase">
              Source: {verification.source}
            </span>
            {verification.lastVerifiedAt && (
              <span className="flex items-center gap-1 mt-1">
                <Clock size={14} /> Last verified: {new Date(verification.lastVerifiedAt).toLocaleDateString()}
              </span>
            )}
            {!verification.verified && (
              <span className="text-warning text-xs mt-1 max-w-[200px] text-right">
                ⚠ Official vehicle verification is temporarily unavailable. Community info shown below.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content - Left */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Community Trust Section */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="border-b border-border p-5 flex items-center gap-3 bg-background/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Community Trust</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <TrustBadge tier={trust.tier} score={trust.score} />
                <p className="text-sm text-text-secondary flex-1">{trust.explanation}</p>
              </div>
              
              {trust.stats && (
                <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-text-primary mb-1">{trust.stats.verifiedRideCount || 0}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Verified Rides</p>
                  </div>
                  <div className="text-center border-l border-border pl-4">
                    <p className="text-3xl font-bold text-text-primary mb-1">{trust.stats.confirmedReportCount || 0}</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Confirmed Reports</p>
                  </div>
                  <div className="text-center border-l border-border pl-4">
                    <p className="text-3xl font-bold text-text-primary mb-1">{trust.stats.nearFarePercentage || 0}%</p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Near Expected Fare</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Recent Verified Experiences */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="border-b border-border p-5 flex items-center gap-3 bg-background/50">
              <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Recent Verified Experiences</h2>
            </div>
            
            <div className="p-6">
              {recentComments && recentComments.length > 0 ? (
                <div className="space-y-4">
                  {recentComments.map((comment) => (
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
                  <p className="text-text-primary font-medium">No verified experiences yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar - Actions & Fare */}
        <div className="space-y-6">
          {fairFareEstimate && (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-primary/5 p-4 border-b border-border">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <IndianRupee size={18} className="text-primary" />
                  Check Fair Fare
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-text-secondary mb-4">
                  Calculate estimated fare for your route with this auto.
                </p>
                <button 
                  onClick={() => navigate(`/search?plate=${vehicle.registrationNumber}`)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Calculate Fare
                </button>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 px-1">
              Actions
            </h3>
            
            <button 
              onClick={() => navigate(`/log-ride?plate=${vehicle.registrationNumber}`)}
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
              onClick={() => navigate(`/reports?plate=${vehicle.registrationNumber}`)}
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
    </div>
  );
}
