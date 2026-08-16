import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActionCard from '../components/QuickActionCard';
import { getRouteWatch } from '../api/endpoints';

export default function HomePage() {
  const [plateNumber, setPlateNumber] = useState('');
  const [routeWatch, setRouteWatch] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();
    if (!plateNumber.trim()) return;
    navigate(`/plate/${encodeURIComponent(plateNumber.trim().toUpperCase())}`);
  };

  const loadRouteWatch = async () => {
    setLoading(true);
    try {
      const response = await getRouteWatch();
      setRouteWatch(response.data.hotspots || []);
    } catch {
      setRouteWatch([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
      <section className="space-y-6 text-center">
        <h1 className="text-4xl font-bold text-dark">Fair auto fares for Nagpur.</h1>
        <p className="mx-auto max-w-2xl text-dark/70">
          Search plate trust, log rides, and report issues to make city travel more transparent.
        </p>
        <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl gap-3">
          <input
            type="text"
            value={plateNumber}
            onChange={(event) => setPlateNumber(event.target.value)}
            placeholder="Enter auto plate number"
            className="flex-1 rounded-md border border-primary/30 px-4 py-3 focus:border-primary focus:outline-none"
          />
          <button type="submit" className="rounded-md bg-primary px-5 py-3 font-medium text-surface">
            Search
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <QuickActionCard
          title="Log a ride"
          description="Store trip details to improve fare transparency in your area."
          to="/dashboard"
          cta="Open Dashboard"
        />
        <QuickActionCard
          title="Report an issue"
          description="File trusted community reports for overcharging or meter refusal."
          to="/dashboard"
          cta="File Report"
        />
      </section>

      <section className="space-y-4 rounded-xl border border-accent/40 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Route Watch Summary</h2>
          <button
            type="button"
            onClick={loadRouteWatch}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-dark"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {routeWatch.length === 0 ? (
          <p className="text-sm text-dark/70">No public route-watch data yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {routeWatch.map((zone) => (
              <div key={`${zone.pickup}-${zone.drop}`} className="rounded-md border border-dark/15 p-4 text-sm">
                <p className="font-medium text-dark">
                  {zone.pickup} → {zone.drop}
                </p>
                <p className="text-dark/70">Rides logged: {zone.totalRides}</p>
                <p className="text-dark/70">Avg fare: ₹{zone.averageFare}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
