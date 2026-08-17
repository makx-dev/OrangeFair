import { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  FileWarning, 
  Car, 
  Calendar, 
  MapPin, 
  IndianRupee, 
  MessageSquare, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyReports, getMyRides, getMyComments, getMyRtoEscalations, deleteComment, updateComment } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/TranslationProvider';

const REPORT_FILTERS = ['All', 'Submitted', 'UnderReview', 'PatternConfirmed', 'Flagged'];

const TAG_OPTIONS = [
  'Used Meter',
  'Fair Fare',
  'Safe Driving',
  'Polite',
  'Clean Auto',
  'Helpful Driver',
  'Overcharged',
  'Refused Meter',
  'Refused Short Trip',
  'Rude',
  'Unsafe Driving',
  'Unclear Fare',
];

export default function HistoryPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'rto' | 'comments' | 'rides'
  const [reportFilter, setReportFilter] = useState('All');

  const [reports, setReports] = useState([]);
  const [rides, setRides] = useState([]);
  const [comments, setComments] = useState([]);
  const [escalations, setEscalations] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment edit modal state
  const [editingComment, setEditingComment] = useState(null);
  const [editTag, setEditTag] = useState('');
  const [editText, setEditText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [editError, setEditError] = useState('');

  // Comment delete modal state
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [reportsRes, ridesRes, commentsRes, escalationsRes] = await Promise.all([
        getMyReports({ status: reportFilter !== 'All' ? reportFilter : undefined }),
        getMyRides(),
        getMyComments(),
        getMyRtoEscalations(),
      ]);

      setReports(reportsRes.data?.reports || []);
      setRides(ridesRes.data?.rides || []);
      setComments(commentsRes.data?.comments || []);
      setEscalations(escalationsRes.data?.escalations || []);
    } catch (err) {
      console.error('Failed to load history data:', err);
      setError('Unable to load your activity history. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [reportFilter]);

  const handleOpenEditComment = (comment) => {
    setEditingComment(comment);
    setEditTag(comment.tag);
    setEditText(comment.text);
    setEditError('');
  };

  const handleSaveCommentEdit = async (e) => {
    e.preventDefault();
    if (!editTag || !editText.trim()) {
      setEditError('Tag and comment text are required.');
      return;
    }
    if (editText.trim().length > 100) {
      setEditError('Comment text cannot exceed 100 characters.');
      return;
    }

    setIsUpdatingComment(true);
    setEditError('');

    try {
      await updateComment(editingComment._id, { tag: editTag, text: editText.trim() });
      setEditingComment(null);
      await fetchAllData();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update comment.');
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!deletingCommentId) return;
    setIsDeletingComment(true);
    try {
      await deleteComment(deletingCommentId);
      setDeletingCommentId(null);
      await fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    } finally {
      setIsDeletingComment(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-info/10 text-info border-info/20';
      case 'UnderReview':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'PatternConfirmed':
        return 'bg-error/10 text-error border-error/20 font-bold';
      case 'Flagged':
        return 'bg-error text-white font-bold';
      case 'User Submitted':
        return 'bg-primary/10 text-primary-dark border-primary/20 font-semibold';
      case 'Prepared':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Resolved':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-surface border-border text-text-secondary';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <HistoryIcon className="text-primary" size={32} />
            Your Activity History
          </h1>
          <p className="text-text-secondary">
            Track your filed reports, RTO escalations, community experiences, and ride history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/log-ride')}
            className="px-4 py-2 bg-surface border border-border text-text-primary hover:border-primary/50 text-sm font-semibold rounded-xl transition-colors"
          >
            Log Ride
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-colors"
          >
            File Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        {[
          { id: 'reports', label: 'My Reports', count: reports.length, icon: FileWarning },
          { id: 'rto', label: 'RTO Escalations', count: escalations.length, icon: ShieldAlert },
          { id: 'comments', label: 'My Comments', count: comments.length, icon: MessageSquare },
          { id: 'rides', label: 'Ride History', count: rides.length, icon: Car },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-background'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-background text-text-secondary'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-6 bg-error/10 border border-error/20 rounded-2xl text-center space-y-3">
          <AlertTriangle className="mx-auto text-error" size={32} />
          <p className="text-text-primary font-medium">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-background"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tab 1: My Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Status Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter size={14} /> Filter Status:
            </span>
            {REPORT_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setReportFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  reportFilter === f
                    ? 'bg-primary/10 border-primary text-primary-dark ring-1 ring-primary'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {f === 'UnderReview' ? 'Under Review' : f === 'PatternConfirmed' ? 'Pattern Confirmed' : f}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-text-secondary">Loading report history...</div>
          ) : reports.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-secondary">
                          {report.reportCode || `#OF-${String(report._id).slice(-4).toUpperCase()}`}
                        </span>
                        <Link
                          to={`/auto/${report.plateNumber}`}
                          className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-bold text-text-primary hover:text-primary transition-colors uppercase tracking-wider"
                        >
                          {report.plateNumber}
                        </Link>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getStatusBadge(report.status)}`}
                      >
                        {report.status === 'PatternConfirmed'
                          ? 'Pattern Confirmed'
                          : report.status === 'UnderReview'
                          ? 'Under Review'
                          : report.status}
                      </span>
                    </div>

                    <div className="text-base font-bold text-text-primary mb-1">
                      {report.reason}
                    </div>

                    {report.description && (
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                        "{report.description}"
                      </p>
                    )}

                    <p className="text-xs text-text-secondary bg-background/60 p-2.5 rounded-lg mb-4 border border-border/50">
                      {report.explanation || 'The report is in the verification process.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-secondary flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      {(report.status === 'PatternConfirmed' || report.status === 'Flagged') && (
                        <Link
                          to={`/rto/prepare/${report._id}`}
                          className="text-xs font-bold text-error hover:underline flex items-center gap-1 bg-error/10 px-2.5 py-1 rounded-md"
                        >
                          <ShieldAlert size={12} />
                          RTO Escalation
                        </Link>
                      )}
                      <Link
                        to={`/reports/${report._id}/status`}
                        className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1"
                      >
                        View Details
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center">
              <FileWarning size={36} className="mx-auto text-text-secondary/40 mb-3" />
              <h3 className="text-lg font-bold text-text-primary mb-1">No reports found</h3>
              <p className="text-sm text-text-secondary mb-4">
                {reportFilter !== 'All'
                  ? `You have no reports matching status "${reportFilter}".`
                  : 'You have not submitted any community reports yet.'}
              </p>
              <button
                onClick={() => navigate('/reports')}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                File an Issue Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: RTO Escalations */}
      {activeTab === 'rto' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-text-secondary">Loading RTO escalations...</div>
          ) : escalations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {escalations.map((esc) => (
                <div
                  key={esc._id}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-primary/10 text-primary-dark px-2.5 py-1 rounded-md">
                          {esc.escalationId}
                        </span>
                        <Link
                          to={`/auto/${esc.plateNumber}`}
                          className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-bold text-text-primary hover:text-primary transition-colors uppercase"
                        >
                          {esc.plateNumber}
                        </Link>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusBadge(esc.status)}`}>
                        {esc.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-text-primary mb-1">{esc.complaintType}</h3>
                    <p className="text-xs text-text-secondary mb-2">{esc.subject}</p>

                    {esc.externalReferenceNumber && (
                      <div className="p-2.5 bg-background rounded-xl border border-border text-xs flex items-center justify-between">
                        <span className="text-text-secondary font-medium">Official Reference:</span>
                        <span className="font-mono font-bold text-text-primary">
                          {esc.externalReferenceNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-secondary flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(esc.createdAt).toLocaleDateString()}
                    </span>

                    <Link
                      to={`/rto/${esc._id}`}
                      className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      View Complaint
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center">
              <ShieldAlert size={36} className="mx-auto text-text-secondary/40 mb-3" />
              <h3 className="text-lg font-bold text-text-primary mb-1">No RTO escalations yet</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
                When a report reaches Pattern Confirmed status with corroborating community evidence, you can prepare and track an official RTO grievance.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-text-secondary">Loading your comments...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((c) => (
                <div
                  key={c._id}
                  className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-bold text-text-primary uppercase">
                        {c.plateNumber}
                      </span>
                      <span className="px-2.5 py-1 bg-primary/10 text-primary-dark border border-primary/20 rounded-md text-xs font-semibold">
                        {c.tag}
                      </span>
                      {c.status === 'under_review' && (
                        <span className="px-2 py-0.5 bg-warning/10 text-warning border border-warning/20 rounded text-xs font-medium">
                          Under Moderation Review
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-text-primary font-medium">"{c.text}"</p>

                    {c.driverReply && (
                      <div className="p-3 bg-background border border-border rounded-xl text-xs space-y-1">
                        <p className="font-bold text-text-secondary uppercase tracking-wider">Driver Response:</p>
                        <p className="text-text-primary">"{c.driverReply}"</p>
                      </div>
                    )}

                    <p className="text-xs text-text-secondary">
                      Posted on {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <button
                      onClick={() => handleOpenEditComment(c)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-background border border-border rounded-xl text-xs font-semibold text-text-primary transition-colors"
                    >
                      <Edit3 size={14} className="text-primary" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingCommentId(c._id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-error/10 hover:bg-error/20 border border-error/20 rounded-xl text-xs font-semibold text-error transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center">
              <MessageSquare size={36} className="mx-auto text-text-secondary/40 mb-3" />
              <h3 className="text-lg font-bold text-text-primary mb-1">No comments posted</h3>
              <p className="text-sm text-text-secondary">
                You haven't posted any community experiences on auto profiles yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Ride History */}
      {activeTab === 'rides' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-text-secondary">Loading ride history...</div>
          ) : rides.length > 0 ? (
            <div className="divide-y divide-border bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
              {rides.map((ride) => (
                <div key={ride._id} className="p-5 hover:bg-background/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/auto/${ride.plateNumber}`}
                        className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-bold text-text-primary hover:text-primary transition-colors uppercase"
                      >
                        {ride.plateNumber}
                      </Link>
                      <span className="text-xs text-text-secondary">
                        {ride.passengerCount} passenger{ride.passengerCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-success font-bold text-lg">
                      <IndianRupee size={16} />
                      {ride.fareAmount}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-text-primary font-medium mb-3">
                    <MapPin size={16} className="text-primary shrink-0" />
                    <span className="truncate">{ride.route?.pickup || 'Sitabuldi'}</span>
                    <span className="text-text-secondary">→</span>
                    <span className="truncate">{ride.route?.drop || 'Destination'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(ride.timestamp || ride.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/reports?plate=${ride.plateNumber}`}
                      className="text-text-secondary hover:text-error transition-colors"
                    >
                      Report issue with this ride
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center">
              <Car size={36} className="mx-auto text-text-secondary/40 mb-3" />
              <h3 className="text-lg font-bold text-text-primary mb-1">No rides logged</h3>
              <p className="text-sm text-text-secondary mb-4">
                Start logging your auto rides to keep an accurate record of fares.
              </p>
              <button
                onClick={() => navigate('/log-ride')}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                Log a Ride
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Comment Modal */}
      {editingComment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Edit3 size={18} className="text-primary" />
                Edit Your Experience
              </h3>
              <span className="px-2 py-0.5 bg-background border border-border rounded text-xs font-bold text-text-primary uppercase">
                {editingComment.plateNumber}
              </span>
            </div>

            {editError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveCommentEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Select Tag
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-border rounded-xl bg-background">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditTag(tag)}
                      className={`p-2 rounded-lg text-xs font-semibold text-center transition-all ${
                        editTag === tag
                          ? 'bg-primary text-white shadow-xs font-bold'
                          : 'bg-surface hover:bg-surface/80 text-text-primary border border-border'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Comment Text
                  </label>
                  <span
                    className={`text-xs ${
                      editText.length >= 100 ? 'text-error font-bold' : 'text-text-secondary'
                    }`}
                  >
                    {editText.length}/100
                  </span>
                </div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={100}
                  rows={3}
                  placeholder="Share concise details about your ride..."
                  className="w-full p-3 bg-background border border-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="px-4 py-2 bg-surface hover:bg-background border border-border rounded-xl text-xs font-semibold text-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingComment}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isUpdatingComment ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Comment Modal */}
      {deletingCommentId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-text-primary">Delete this comment?</h3>
              <p className="text-xs text-text-secondary">
                This cannot be undone. Your comment will be permanently removed from this auto's community record.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeletingCommentId(null)}
                className="px-5 py-2.5 bg-surface hover:bg-background border border-border rounded-xl text-xs font-semibold text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteComment}
                disabled={isDeletingComment}
                className="px-5 py-2.5 bg-error hover:bg-error/90 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isDeletingComment ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
