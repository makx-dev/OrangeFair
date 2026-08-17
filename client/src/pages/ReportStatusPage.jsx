import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReportDetail } from '../api/endpoints';
import { 
  FileWarning, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowLeft, 
  Car, 
  Calendar, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink 
} from 'lucide-react';
import { useTranslation } from '../i18n/TranslationProvider';

export default function ReportStatusPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const { data } = await getReportDetail(id);
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report status.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-text-secondary">Loading report status and verification details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-error/10 border border-error/20 rounded-2xl p-8 text-center space-y-4">
        <AlertTriangle className="mx-auto text-error" size={40} />
        <h2 className="text-lg font-bold text-text-primary">Unable to load report</h2>
        <p className="text-sm text-text-secondary">{error}</p>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold hover:bg-background transition-colors"
        >
          <ArrowLeft size={16} /> Back to History
        </Link>
      </div>
    );
  }

  const stages = [
    { key: 'Submitted', label: 'Report received', sub: 'Report in verification queue', icon: CheckCircle2 },
    { key: 'UnderReview', label: 'Under Review', sub: 'Evidence is being reviewed & compared', icon: Clock },
    { key: 'PatternConfirmed', label: 'Pattern Confirmed', sub: 'Multiple corroborating reports found', icon: AlertTriangle },
    { key: 'Flagged', label: 'Flagged', sub: 'Vehicle trust status updated across platform', icon: ShieldAlert },
  ];

  const currentIdx = stages.findIndex((s) => s.key === report.status);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft size={18} /> Back to History
        </Link>
      </div>

      {/* Main Report Card */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header banner */}
        <div className="p-6 bg-background/50 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-text-secondary uppercase mb-1">
              <FileWarning size={16} className="text-error" />
              <span>Report Code</span>
            </div>
            <h1 className="text-2xl font-black text-text-primary tracking-wide">
              {report.reportCode || `#OF-${String(report._id).slice(-4).toUpperCase()}`}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                report.status === 'PatternConfirmed'
                  ? 'bg-error/10 text-error border-error/20'
                  : report.status === 'UnderReview'
                  ? 'bg-warning/10 text-warning border-warning/20'
                  : report.status === 'Flagged'
                  ? 'bg-error text-white font-bold'
                  : 'bg-info/10 text-info border-info/20'
              }`}
            >
              {report.status === 'PatternConfirmed'
                ? 'Pattern Confirmed'
                : report.status === 'UnderReview'
                ? 'Under Review'
                : report.status}
            </span>
          </div>
        </div>

        {/* Content details */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                Vehicle Registration
              </p>
              <div className="flex items-center gap-2">
                <Link
                  to={`/auto/${report.plateNumber}`}
                  className="text-lg font-bold text-primary hover:underline uppercase flex items-center gap-1.5"
                >
                  <Car size={18} />
                  {report.plateNumber}
                </Link>
                <span className="text-xs px-2 py-0.5 bg-background border border-border rounded text-text-secondary font-medium">
                  {report.plateTrustTier || 'Watch'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                Date Submitted
              </p>
              <p className="text-base font-semibold text-text-primary flex items-center gap-1.5">
                <Calendar size={16} className="text-text-secondary" />
                {new Date(report.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
              Issue Type
            </p>
            <p className="text-lg font-bold text-text-primary">{report.reason}</p>
            {report.description && (
              <p className="text-sm text-text-secondary mt-2 bg-background p-4 rounded-xl border border-border font-medium">
                "{report.description}"
              </p>
            )}
          </div>

          {/* Trust impact explanation */}
          {report.trustContributionExplanation && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
              <ShieldCheck className="text-primary shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-text-primary">
                <p className="font-bold text-primary-dark">Trust Calculation Impact</p>
                <p className="text-text-secondary mt-0.5">{report.trustContributionExplanation}</p>
              </div>
            </div>
          )}

          {/* Lifecycle timeline */}
          <div className="pt-4 border-t border-border space-y-4">
            <h2 className="text-base font-bold text-text-primary">Report Verification Timeline</h2>

            <div className="space-y-4">
              {stages.map((stage, idx) => {
                const isPast = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                const isFuture = idx > currentIdx;

                return (
                  <div
                    key={stage.key}
                    className={`flex items-start gap-4 p-3.5 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-primary/5 border border-primary/20'
                        : isPast
                        ? 'bg-background/40 border border-border/50'
                        : 'opacity-40 border border-transparent'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPast ? (
                        <div className="w-7 h-7 rounded-full bg-success/20 text-success flex items-center justify-center font-bold">
                          <CheckCircle2 size={18} />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                          <stage.icon size={18} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-border flex items-center justify-center text-text-secondary/40 text-xs">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>
                          {stage.label}
                        </p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-md tracking-wider">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{stage.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RTO Escalation Section */}
          {report.isEligibleForRto ? (
            <div className="pt-6 border-t border-border">
              <div className="p-6 bg-error/5 border border-error/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-error font-bold text-base">
                    <ShieldAlert size={20} />
                    <span>Eligible for RTO Complaint Escalation</span>
                  </div>
                  <p className="text-xs text-text-secondary max-w-lg">
                    This report has multiple corroborating reports confirming repeated fare irregularity. You can prepare and generate an official RTO complaint preview.
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/rto/prepare/${report._id}`)}
                  className="px-6 py-3 bg-error hover:bg-error/90 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <span>Prepare RTO Complaint</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-border text-xs text-text-secondary">
              ℹ RTO escalation requires a Pattern Confirmed status with at least 3 corroborating reports within 30 days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
