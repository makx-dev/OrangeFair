import { useAuth } from '../context/AuthContext';

const sampleRides = [
  { id: 1, plateNumber: 'MH31AB1234', fareAmount: 180, route: 'Sitabuldi → Airport', timestamp: 'Today' },
  { id: 2, plateNumber: 'MH31CD5678', fareAmount: 95, route: 'Dharampeth → Railway Station', timestamp: 'Yesterday' },
];

const sampleReports = [
  { id: 1, plateNumber: 'MH31AB1234', reason: 'Overcharged', status: 'Submitted' },
  { id: 2, plateNumber: 'MH31EF9999', reason: 'Used Meter', status: 'PatternConfirmed' },
];

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-3 text-dark/70">Login to view your ride history, reports, and account settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <section className="rounded-xl border border-primary/20 p-6">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
        <p className="mt-2 text-dark/70">Manage your rides, reports, and profile settings.</p>
      </section>

      <section className="rounded-xl border border-primary/20 p-6">
        <h2 className="text-xl font-semibold">Ride history</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {sampleRides.map((ride) => (
            <li key={ride.id} className="rounded-md border border-dark/15 p-3">
              <p className="font-medium">{ride.route}</p>
              <p>Plate: {ride.plateNumber}</p>
              <p>Fare: ₹{ride.fareAmount}</p>
              <p className="text-dark/60">{ride.timestamp}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-primary/20 p-6">
        <h2 className="text-xl font-semibold">My filed reports</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {sampleReports.map((report) => (
            <li key={report.id} className="rounded-md border border-dark/15 p-3">
              <p className="font-medium">{report.reason}</p>
              <p>Plate: {report.plateNumber}</p>
              <p>Status: {report.status}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-primary/20 p-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="mt-2 text-sm text-dark/70">Profile and notification controls can be added here.</p>
      </section>
    </div>
  );
}
