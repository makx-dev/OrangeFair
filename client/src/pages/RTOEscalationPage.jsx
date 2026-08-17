import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Copy, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Calendar, 
  Car, 
  FileText, 
  AlertTriangle, 
  Info,
  Check
} from 'lucide-react';
import { 
  prepareRtoComplaint, 
  getRtoEscalationById, 
  markRtoSubmitted 
} from '../api/endpoints';

const ESCALATION_STAGES = [
  { key: 'Prepared', label: 'Prepared by OrangeFair', sub: 'Awaiting external submission' },
  { key: 'User Submitted', label: 'User Submitted', sub: 'Submitted to transport authority' },
  { key: 'Acknowledgement Received', label: 'Acknowledgement Received', sub: 'Grievance token acknowledged' },
  { key: 'Under Review', label: 'Under Review', sub: 'RTO desk verification in progress' },
  { key: 'Resolved', label: 'Resolved / Action Taken', sub: 'Official response recorded' },
];

export default function RTOEscalationPage() {
  const { reportId, id } = useParams();
  const navigate = useNavigate();

  const [escalation, setEscalation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Submit modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [refNumber, setRefNumber] = useState('DEMO-RTO-001');
  const [subDate, setSubDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadEscalation = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (reportId) {
          const { data } = await prepareRtoComplaint(reportId);
          setEscalation(data.escalation);
        } else if (id) {
          const { data } = await getRtoEscalationById(id);
          setEscalation(data.escalation);
        }
      } catch (err) {
        console.error('Failed to load RTO escalation:', err);
        setError(err.response?.data?.message || 'Failed to prepare or retrieve RTO complaint.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEscalation();
  }, [reportId, id]);

  const handleCopyComplaint = () => {
    if (!escalation?.complaintText) return;
    navigator.clipboard.writeText(escalation.complaintText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadComplaint = () => {
    if (!escalation?.complaintText) return;
    const element = document.createElement('a');
    const file = new Blob([escalation.complaintText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${escalation.escalationId}_RTO_Complaint_${escalation.plateNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleMarkAsSubmitted = async (e) => {
    e.preventDefault();
    if (!escalation?._id) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { data } = await markRtoSubmitted(escalation._id, {
        externalReferenceNumber: refNumber.trim() || 'DEMO-RTO-001',
        submissionDate: subDate,
      });

      setEscalation(data.escalation);
      setIsSubmitModalOpen(false);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to update submission status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-text-secondary">Generating structured RTO complaint documentation...</p>
      </div>
    );
  }

  if (error || !escalation) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-error/10 border border-error/20 rounded-2xl p-8 text-center space-y-4">
        <AlertTriangle className="mx-auto text-error" size={40} />
        <h2 className="text-lg font-bold text-text-primary">RTO Escalation Unavailable</h2>
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

  const currentStageIndex = ESCALATION_STAGES.findIndex((s) => s.key === escalation.status);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft size={18} /> Back to History
        </Link>
      </div>

      {/* Header section */}
      <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error">
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-primary/10 text-primary-dark px-2.5 py-0.5 rounded">
                  {escalation.escalationId}
                </span>
                <span className="text-xs text-text-secondary">RTO Grievance Docket</span>
              </div>
              <h1 className="text-2xl font-black text-text-primary tracking-wide mt-0.5">
                RTO Escalation: {escalation.plateNumber}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary-dark border border-primary/20">
              {escalation.status}
            </span>
          </div>
        </div>

        {/* External Submission Honesty Notice */}
        <div className="p-4 bg-info/10 border border-info/20 rounded-xl flex items-start gap-3 text-sm text-text-primary">
          <Info className="text-info shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold text-info">External Submission Protocol</p>
            <p className="text-xs text-text-secondary mt-0.5">
              OrangeFair prepares structured community-backed complaint previews. To ensure official government accountability, commuters submit or file this generated documentation through the official transport portal or local RTO desk and track reference numbers here.
            </p>
          </div>
        </div>

        {/* Current status display */}
        <div className="p-4 bg-background border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div>
            <span className="text-xs text-text-secondary block">Current Platform Status:</span>
            <span className="font-bold text-text-primary">
              {escalation.status === 'Prepared' ? 'Prepared by OrangeFair — Awaiting external submission' : escalation.status}
            </span>
          </div>

          {escalation.externalReferenceNumber ? (
            <div className="sm:text-right">
              <span className="text-xs text-text-secondary block">Official Submission Reference:</span>
              <span className="font-mono font-bold text-primary">
                {escalation.externalReferenceNumber}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              Mark as Submitted
            </button>
          )}
        </div>
      </div>

      {/* Complaint Preview & Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Complaint Letter Preview */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Structured Complaint Preview
              </h2>
              <span className="text-xs text-text-secondary">Official Format</span>
            </div>

            <div className="bg-background border border-border rounded-xl p-5 font-mono text-xs text-text-primary leading-relaxed whitespace-pre-wrap select-all">
              {escalation.complaintText}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleCopyComplaint}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-surface hover:bg-background border border-border rounded-xl text-xs font-bold text-text-primary transition-colors"
              >
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Complaint'}
              </button>

              <button
                onClick={handleDownloadComplaint}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-surface hover:bg-background border border-border rounded-xl text-xs font-bold text-text-primary transition-colors"
              >
                <Download size={16} />
                Download Document
              </button>

              <a
                href="https://transport.maharashtra.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary-dark border border-primary/20 rounded-xl text-xs font-bold transition-colors"
              >
                <ExternalLink size={16} />
                Open Official Grievance Channel
              </a>
            </div>
          </div>
        </div>

        {/* Right Col: Timeline & Incident Metadata */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2">
              Evidence Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-secondary block">Vehicle:</span>
                <span className="font-bold text-text-primary">{escalation.plateNumber}</span>
              </div>
              <div>
                <span className="text-text-secondary block">Reported Irregularity:</span>
                <span className="font-bold text-error">{escalation.complaintType}</span>
              </div>
              <div>
                <span className="text-text-secondary block">Corroborating Evidence:</span>
                <span className="font-medium text-text-primary">
                  {escalation.incidentDetails?.evidenceSummary || 'Multiple corroborating reports found.'}
                </span>
              </div>
              <div>
                <span className="text-text-secondary block">Docket Prepared:</span>
                <span className="font-medium text-text-primary">
                  {new Date(escalation.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Status Tracker */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary border-b border-border pb-2">
              Escalation Tracker
            </h3>

            <div className="space-y-3">
              {ESCALATION_STAGES.map((st, idx) => {
                const isPast = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div
                    key={st.key}
                    className={`flex items-start gap-3 ${
                      idx > currentStageIndex ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPast ? (
                        <CheckCircle2 size={16} className="text-success" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 rounded-full bg-primary border-2 border-surface flex items-center justify-center ring-2 ring-primary/30" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>
                        {st.label}
                      </p>
                      <p className="text-[10px] text-text-secondary">{st.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mark As Submitted Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Record External Submission</h3>
                <p className="text-xs text-text-secondary">Update OrangeFair with your submission details</p>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                {submitError}
              </div>
            )}

            <form onSubmit={handleMarkAsSubmitted} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Official Reference / Token Number (Optional)
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="e.g. DEMO-RTO-001 or RTO123456"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-primary font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <span className="text-[11px] text-text-secondary mt-1 block">
                  Reference number provided by the transport authority or grievance portal.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Submission Date
                </label>
                <input
                  type="date"
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-primary text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-background border border-border rounded-xl text-xs font-semibold text-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
