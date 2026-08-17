import { History, FileWarning, Car, Calendar, MapPin, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sampleRides = [
  { id: 1, plateNumber: 'MH 31 AB 1234', fareAmount: 180, pickup: 'Sitabuldi', drop: 'Airport', date: '2023-10-25', time: '14:30' },
  { id: 2, plateNumber: 'MH 31 CD 5678', fareAmount: 95, pickup: 'Dharampeth', drop: 'Railway Station', date: '2023-10-24', time: '09:15' },
];

const sampleReports = [
  { id: 1, plateNumber: 'MH 31 AB 1234', reason: 'Overcharged', status: 'Submitted', date: '2023-10-25' },
  { id: 2, plateNumber: 'MH 31 EF 9999', reason: 'Refused Meter', status: 'Pattern Confirmed', date: '2023-10-20' },
];

export default function HistoryPage() {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-info/10 text-info border-info/20';
      case 'Under Review': return 'bg-warning/10 text-warning border-warning/20';
      case 'Pattern Confirmed': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-surface border-border text-text-secondary';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <History className="text-primary" size={32} />
          Your Activity History
        </h1>
        <p className="text-text-secondary">View your past rides and the status of your submitted reports.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Ride History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Car size={20} className="text-text-secondary" />
              Ride History
            </h2>
            <button 
              onClick={() => navigate('/log-ride')}
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Log New Ride
            </button>
          </div>
          
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            {sampleRides.length > 0 ? (
              <div className="divide-y divide-border">
                {sampleRides.map((ride) => (
                  <div key={ride.id} className="p-5 hover:bg-background transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-bold text-text-primary uppercase tracking-wider">
                          {ride.plateNumber}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-success font-bold text-lg">
                          <IndianRupee size={16} />
                          {ride.fareAmount}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-text-primary font-medium mb-3">
                      <MapPin size={16} className="text-primary shrink-0" />
                      <span className="truncate">{ride.pickup}</span>
                      <span className="text-text-secondary">→</span>
                      <span className="truncate">{ride.drop}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Calendar size={14} />
                      {ride.date} at {ride.time}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Car size={32} className="mx-auto text-text-secondary mb-3 opacity-50" />
                <p className="text-text-primary font-medium">No rides logged</p>
                <p className="text-sm text-text-secondary mt-1">Start logging your rides to keep track of them here.</p>
              </div>
            )}
          </div>
        </section>

        {/* Reports History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FileWarning size={20} className="text-text-secondary" />
              Filed Reports
            </h2>
            <button 
              onClick={() => navigate('/reports')}
              className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              File New Report
            </button>
          </div>
          
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            {sampleReports.length > 0 ? (
              <div className="divide-y divide-border">
                {sampleReports.map((report) => (
                  <div key={report.id} className="p-5 hover:bg-background transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-bold text-text-primary uppercase tracking-wider">
                          {report.plateNumber}
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    
                    <div className="text-text-primary font-medium mb-3">
                      Issue: {report.reason}
                    </div>
                    
                    <Link 
                      to={`/reports/${report.id}/status`}
                      className="w-full mt-3 block text-center py-2 bg-surface border border-border rounded text-primary hover:bg-background transition-colors font-medium text-sm"
                    >
                      Check Status
                    </Link>

                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-3">
                      <Calendar size={14} />
                      Submitted on {report.date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileWarning size={32} className="mx-auto text-text-secondary mb-3 opacity-50" />
                <p className="text-text-primary font-medium">No reports filed</p>
                <p className="text-sm text-text-secondary mt-1">You haven't filed any issue reports yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
