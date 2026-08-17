import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRouteWatch } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Calculator, Car, FileWarning, Search, ArrowRight, MapPin, Activity } from 'lucide-react';

export default function HomePage() {
  const [plateNumber, setPlateNumber] = useState('');
  const [routeWatch, setRouteWatch] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadRouteWatch();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    if (!plateNumber.trim()) return;
    navigate(`/auto/${encodeURIComponent(plateNumber.trim().toUpperCase())}`);
  };

  const loadRouteWatch = async () => {
    setLoadingRoutes(true);
    try {
      const response = await getRouteWatch();
      setRouteWatch(response.data.hotspots || []);
    } catch {
      setRouteWatch([]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="mt-2 text-text-secondary">Here's what's happening with auto travel in Nagpur today.</p>
      </section>

      {/* Prominent Auto Search */}
      <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-text-primary mb-2">Search an auto before you ride</h2>
          <p className="text-sm text-text-secondary mb-6">Check community trust and recent reports using the registration number.</p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
              <input
                type="text"
                value={plateNumber}
                onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
                placeholder="MH 31 AB 1234"
                className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-medium tracking-wider uppercase"
              />
            </div>
            <button 
              type="submit" 
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-surface font-medium rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Check Auto
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Activity size={20} className="text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/fare-split')}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-surface border border-border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Calculator size={24} />
            </div>
            <span className="font-medium text-sm text-text-primary">Split Fare</span>
          </button>
          
          <button 
            onClick={() => navigate('/log-ride')}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-surface border border-border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <Car size={24} />
            </div>
            <span className="font-medium text-sm text-text-primary">Log a Ride</span>
          </button>
          
          <button 
            onClick={() => navigate('/reports')}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-surface border border-border rounded-xl hover:border-error/50 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <FileWarning size={24} />
            </div>
            <span className="font-medium text-sm text-text-primary">Report Issue</span>
          </button>
          
          <button 
            onClick={() => navigate('/search')}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-surface border border-border rounded-xl hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center text-info group-hover:scale-110 transition-transform">
              <Search size={24} />
            </div>
            <span className="font-medium text-sm text-text-primary">Search Auto</span>
          </button>
        </div>
      </section>

      {/* Two Column Layout for Bottom Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <section>
          <h3 className="text-lg font-bold text-text-primary mb-4">Recent Activity</h3>
          <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center h-[250px]">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-text-secondary mb-3">
              <Activity size={24} />
            </div>
            <p className="text-text-primary font-medium">No recent activity</p>
            <p className="text-sm text-text-secondary mt-1">Your recent rides and reports will appear here.</p>
            <button 
              onClick={() => navigate('/log-ride')}
              className="mt-4 text-primary text-sm font-medium hover:text-primary-dark transition-colors"
            >
              Log your first ride
            </button>
          </div>
        </section>

        {/* Route Watch */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary">Route Watch</h3>
            <button 
              onClick={loadRouteWatch}
              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="bg-surface border border-border rounded-xl p-4 h-[250px] overflow-y-auto">
            {loadingRoutes ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : routeWatch.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <MapPin className="text-text-secondary mb-2" size={24} />
                <p className="text-text-primary font-medium text-sm">No route insights available</p>
                <p className="text-xs text-text-secondary mt-1">Check back later for community updates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {routeWatch.map((zone, idx) => (
                  <div key={idx} className="p-3 border border-border rounded-lg hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-primary" />
                      <p className="font-medium text-sm text-text-primary truncate">
                        {zone.pickup} → {zone.drop}
                      </p>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">Rides: <span className="font-medium text-text-primary">{zone.totalRides}</span></span>
                      <span className="text-text-secondary">Avg Fare: <span className="font-medium text-primary">₹{zone.averageFare}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
