import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReportStatus } from '../api/endpoints'; // force reload
import { FileWarning, CheckCircle2, Clock, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationProvider';

export default function ReportStatusPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await getReportStatus(id);
        setReport(data);
      } catch (err) {
        setError('Failed to load report status.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [id]);

  if (isLoading) {
    return <div className="text-center py-12">Loading report status...</div>;
  }

  if (error || !report) {
    return <div className="text-center text-error py-12">{error}</div>;
  }

  const stages = [
    { key: 'Submitted', label: 'Report received', icon: CheckCircle2 },
    { key: 'UnderReview', label: 'Community evidence being checked', icon: Clock },
    { key: 'PatternConfirmed', label: 'Requires corroborating reports', icon: AlertTriangle },
    { key: 'Flagged', label: 'Final trust action', icon: ShieldAlert }
  ];

  const currentIdx = stages.findIndex(s => s.key === report.status);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Link to="/history" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-4">
        <ArrowLeft size={20} /> Back to History
      </Link>
      
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <FileWarning className="text-error" /> Report #{report._id.substring(report._id.length - 6).toUpperCase()}
        </h1>
        
        <div className="space-y-4 mb-8">
          <div>
            <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">Vehicle</p>
            <p className="text-lg font-bold text-text-primary">{report.plateNumber}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-1">Issue</p>
            <p className="text-lg font-medium text-text-primary">{report.reason}</p>
            {report.description && <p className="text-sm text-text-secondary mt-1">"{report.description}"</p>}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-bold text-text-primary mb-6">Status Tracker</h2>
          
          <div className="space-y-6">
            {stages.map((stage, idx) => {
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isFuture = idx > currentIdx;
              
              let Icon = stage.icon;
              let textColor = 'text-text-primary';
              if (isPast) textColor = 'text-success';
              else if (isCurrent) textColor = 'text-primary';
              else textColor = 'text-text-secondary opacity-50';

              return (
                <div key={stage.key} className={`flex items-start gap-4 ${isFuture ? 'opacity-50' : ''}`}>
                  <div className={`mt-0.5 ${textColor}`}>
                    {isPast ? <CheckCircle2 size={24} /> : (isCurrent ? <Icon size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-border" />)}
                  </div>
                  <div>
                    <p className={`font-bold ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>{t(`reports.status.${stage.key}`) || stage.key}</p>
                    <p className="text-sm text-text-secondary">{stage.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
