import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import TrustBadge from '../components/TrustBadge';
import { 
  getPlate, 
  getPlateComments, 
  createComment, 
  updateComment, 
  deleteComment, 
  reportComment 
} from '../api/endpoints';
import { 
  Shield, 
  MessageSquare, 
  IndianRupee, 
  AlertTriangle, 
  Car, 
  BadgeCheck, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Flag, 
  Check, 
  X 
} from 'lucide-react';
import { useTranslation } from '../i18n/TranslationProvider';
import { useAuth } from '../context/AuthContext';

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

export default function PlateDetailPage() {
  const { plateNumber } = useParams();
  const [plateData, setPlateData] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Add Comment Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('Fair Fare');
  const [newText, setNewText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Edit Comment Modal
  const [editingComment, setEditingComment] = useState(null);
  const [editTag, setEditTag] = useState('');
  const [editText, setEditText] = useState('');
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Comment Modal
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState('');

  const fetchPlateAndComments = async () => {
    setIsLoading(true);
    try {
      const [plateRes, commentsRes] = await Promise.all([
        getPlate(plateNumber),
        getPlateComments(plateNumber),
      ]);
      setPlateData(plateRes.data);
      setComments(commentsRes.data?.comments || plateRes.data?.recentComments || []);
      setError('');
    } catch {
      setError('Could not load plate data. The auto registration might not exist in our database yet.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlateAndComments();
  }, [plateNumber]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newTag || !newText.trim()) {
      setCommentError('Please select a tag and enter comment text.');
      return;
    }
    if (newText.trim().length > 100) {
      setCommentError('Comment text cannot exceed 100 characters.');
      return;
    }

    setIsSubmittingComment(true);
    setCommentError('');

    try {
      await createComment({
        plateNumber: plateNumber.toUpperCase(),
        tag: newTag,
        text: newText.trim(),
      });

      setIsAddModalOpen(false);
      setNewText('');
      setNewTag('Fair Fare');
      showToast('Your experience has been verified and posted!');
      await fetchPlateAndComments();
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to add comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleOpenEdit = (comment) => {
    setEditingComment(comment);
    setEditTag(comment.tag);
    setEditText(comment.text);
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
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
      showToast('Comment updated successfully.');
      await fetchPlateAndComments();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update comment.');
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCommentId) return;
    setIsDeletingComment(true);
    try {
      await deleteComment(deletingCommentId);
      setDeletingCommentId(null);
      showToast('Comment deleted successfully.');
      await fetchPlateAndComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleReportComment = async (commentId) => {
    try {
      await reportComment(commentId);
      showToast('Comment reported and submitted for moderation review.');
      await fetchPlateAndComments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to report comment.');
    }
  };

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

  const { vehicle, verification, trust, fairFareEstimate } = plateData;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in slide-in-from-top-4 duration-300">
          <BadgeCheck size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header Section: Official Verification */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <div
          className={`p-4 md:p-6 text-white flex items-center gap-3 ${
            verification.verified ? 'bg-success' : 'bg-surface border-b border-border text-text-primary'
          }`}
        >
          {verification.verified ? (
            <>
              <BadgeCheck size={28} className="text-white" />
              <h2 className="text-xl md:text-2xl font-bold tracking-wide flex-1">RC VERIFIED</h2>
            </>
          ) : (
            <>
              <FileCheck size={28} className="text-text-secondary" />
              <h2 className="text-xl md:text-2xl font-bold tracking-wide flex-1 text-text-primary">
                VEHICLE PROFILE
              </h2>
            </>
          )}
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-wider mb-2">
              {vehicle.registrationNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-lg font-medium text-text-secondary">
              <span className="flex items-center gap-2">
                <Car size={20} /> {vehicle.vehicleType || 'Auto Rickshaw'}
              </span>
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
                <div className="flex-1">
                  <p className="text-sm text-text-secondary">{trust.explanation}</p>
                </div>
              </div>

              {trust.stats && (
                <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-text-primary mb-1">
                      {trust.stats.verifiedRideCount || 0}
                    </p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                      Verified Rides
                    </p>
                  </div>
                  <div className="text-center border-l border-border pl-4">
                    <p className="text-3xl font-bold text-text-primary mb-1">
                      {trust.stats.confirmedReportCount || 0}
                    </p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                      Confirmed Reports
                    </p>
                  </div>
                  <div className="text-center border-l border-border pl-4">
                    <p className="text-3xl font-bold text-text-primary mb-1">
                      {trust.stats.nearFarePercentage || 0}%
                    </p>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                      Near Expected Fare
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Community Experiences (Comments) */}
          <section className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="border-b border-border p-5 flex items-center justify-between bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{t('plate.communityExperiences')}</h2>
                  <p className="text-xs text-text-secondary">{comments.length} verified experiences</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Plus size={16} />
                Add Experience
              </button>
            </div>

            <div className="p-6">
              {comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const isOwnComment =
                      user &&
                      (comment.riderId?._id === user.id ||
                        comment.riderId === user.id ||
                        comment.riderId?.email === user.email);

                    return (
                      <div
                        key={comment._id}
                        className="bg-background border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1 border ${
                                comment.tag === 'Overcharged' ||
                                comment.tag === 'Refused Meter' ||
                                comment.tag === 'Refused Short Trip' ||
                                comment.tag === 'Rude' ||
                                comment.tag === 'Unsafe Driving' ||
                                comment.tag === 'Unclear Fare'
                                  ? 'bg-error/10 text-error border-error/20'
                                  : 'bg-success/10 text-success border-success/20'
                              }`}
                            >
                              {comment.tag === 'Overcharged' ||
                              comment.tag === 'Refused Meter' ||
                              comment.tag === 'Refused Short Trip' ||
                              comment.tag === 'Rude' ||
                              comment.tag === 'Unsafe Driving' ||
                              comment.tag === 'Unclear Fare' ? (
                                <AlertTriangle size={12} />
                              ) : (
                                <BadgeCheck size={12} />
                              )}
                              {comment.tag}
                            </span>

                            {isOwnComment && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary-dark rounded text-[10px] font-bold uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-text-secondary">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>

                            {isOwnComment ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEdit(comment)}
                                  className="p-1 text-text-secondary hover:text-primary transition-colors"
                                  title="Edit comment"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => setDeletingCommentId(comment._id)}
                                  className="p-1 text-text-secondary hover:text-error transition-colors"
                                  title="Delete comment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleReportComment(comment._id)}
                                className="p-1 text-text-secondary hover:text-warning transition-colors"
                                title="Report comment"
                              >
                                <Flag size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-text-primary text-sm font-medium">"{comment.text}"</p>

                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span className="font-semibold">
                            {comment.riderId?.name || (isOwnComment ? user.name : 'Verified Rider')}
                          </span>
                          <span>•</span>
                          <span className="text-success font-medium">Verified transit check</span>
                        </div>

                        {comment.driverReply && (
                          <div className="mt-3 pt-3 border-t border-border bg-surface rounded-xl p-3.5 text-xs space-y-1">
                            <p className="font-bold text-text-secondary uppercase tracking-wider">
                              Driver Response:
                            </p>
                            <p className="text-text-primary font-medium">"{comment.driverReply}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare size={32} className="mx-auto text-text-secondary/50 mb-3" />
                  <p className="text-text-primary font-medium">{t('plate.noExperiences')}</p>
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
                  onClick={() => navigate(`/local-fare?plate=${vehicle.registrationNumber}`)}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
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
              className="w-full bg-success/10 hover:bg-success border-success hover:border-success/90 text-success hover:text-white border rounded-xl p-4 transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Car size={20} />
              </div>
              <div className="text-left font-medium text-sm">Log a Ride</div>
            </button>

            <button
              onClick={() => navigate(`/reports?plate=${vehicle.registrationNumber}`)}
              className="w-full bg-error/10 hover:bg-error border-error hover:border-error/90 text-error hover:text-white border rounded-xl p-4 transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <AlertTriangle size={20} />
              </div>
              <div className="text-left font-medium text-sm">Report Issue</div>
            </button>
          </div>
        </div>
      </div>

      {/* Add Comment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                Add Community Experience
              </h3>
              <span className="px-2.5 py-1 bg-background border border-border rounded text-xs font-bold text-text-primary uppercase">
                {vehicle.registrationNumber}
              </span>
            </div>

            {commentError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                {commentError}
              </div>
            )}

            <form onSubmit={handleAddComment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Select Experience Tag *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-border rounded-xl bg-background">
                  {TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewTag(tag)}
                      className={`p-2 rounded-lg text-xs font-semibold text-center transition-all ${
                        newTag === tag
                          ? 'bg-primary text-white font-bold shadow-xs'
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
                    Experience Details *
                  </label>
                  <span
                    className={`text-xs ${
                      newText.length >= 100 ? 'text-error font-bold' : 'text-text-secondary'
                    }`}
                  >
                    {newText.length}/100
                  </span>
                </div>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  maxLength={100}
                  rows={3}
                  required
                  placeholder="e.g. Driver used meter without negotiating."
                  className="w-full p-3 bg-background border border-border rounded-xl text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-background border border-border rounded-xl text-xs font-semibold text-text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Experience'}
                </button>
              </div>
            </form>
          </div>
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
              <span className="px-2.5 py-1 bg-background border border-border rounded text-xs font-bold text-text-primary uppercase">
                {editingComment.plateNumber}
              </span>
            </div>

            {editError && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
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
                          ? 'bg-primary text-white font-bold shadow-xs'
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
                onClick={handleConfirmDelete}
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
