import React, { useState, useEffect } from 'react';
import { BadgeCheck, CircleCheck, TriangleAlert, Loader2, Trash2, MessageSquarePlus } from 'lucide-react';
import axios from '../../api/axios';

const dummyComments = [
  { _id: 'dummy1', tag: 'Fair Fare', text: 'Driver was polite and charged exactly what was shown on the meter.', createdAt: new Date().toISOString(), isPrototypeData: true },
  { _id: 'dummy2', tag: 'Safe Driving', text: 'Very smooth ride, didn\'t rush through traffic.', createdAt: new Date().toISOString(), isPrototypeData: true },
  { _id: 'dummy3', tag: 'Overcharged', text: 'Asked for 50 rupees extra at the end of the trip.', createdAt: new Date(Date.now() - 86400000).toISOString(), isPrototypeData: true }
];

const tags = [
  'Overcharged', 'Refused Meter', 'Rude', 'Safe Driving', 
  'Used Meter', 'Refused Short Trip', 'Fair Fare'
];

const CommunityExperiences = ({ routeKey }) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [newTag, setNewTag] = useState('Fair Fare');
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!routeKey) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/local-fare/comments', { params: { routeKey } });
      if (response.data.comments && response.data.comments.length > 0) {
        setComments(response.data.comments);
      } else {
        // Use dummy comments if none exist for the prototype
        setComments(dummyComments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      // Fallback to dummy on error as well for prototype purposes
      setComments(dummyComments);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [routeKey]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await axios.post('/local-fare/comments', {
        routeKey,
        tag: newTag,
        text: newText,
        isPrototypeData: true
      });
      
      // If we were using dummy comments and add a real one, it's better to fetch fresh
      // But for UI speed we can just prepend it
      const newComment = response.data.comment;
      
      // Remove dummy comments if they were showing and we added a real one, 
      // or just keep them for prototype feel. We'll just prepend.
      setComments(prev => [newComment, ...prev.filter(c => !c._id.startsWith('dummy'))]);
      
      setNewText('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding comment:', err);
      // Fallback: just add to UI state for prototype feel if backend fails
      const fallbackComment = {
        _id: 'local_' + Date.now(),
        tag: newTag,
        text: newText,
        createdAt: new Date().toISOString(),
        isPrototypeData: true
      };
      setComments(prev => [fallbackComment, ...prev]);
      setNewText('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      // If it's a real comment (not dummy or local fallback), delete from backend
      if (!commentId.startsWith('dummy') && !commentId.startsWith('local')) {
        await axios.delete(`/local-fare/comments/${commentId}`);
      }
      // Update UI
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Community Experiences</h3>
        <div className="flex justify-center p-4">
          <Loader2 className="animate-spin text-text-secondary" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
          Community Experiences
        </h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
        >
          <MessageSquarePlus size={16} />
          {showAddForm ? 'Cancel' : 'Add Comment'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddComment} className="bg-surface border border-primary/30 rounded-xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Tag</label>
            <select 
              value={newTag} 
              onChange={(e) => setNewTag(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            >
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Experience</label>
            <textarea 
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Share your experience on this route..."
              className="w-full bg-background border border-border rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors resize-none"
              rows={3}
              maxLength={100}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting || !newText.trim()}
            className="w-full bg-primary text-white font-medium py-2 rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
          </button>
        </form>
      )}
      
      {comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => {
            // Determine icon based on tag
            const isNegative = ['Overcharged', 'Refused Meter', 'Rude', 'Refused Short Trip'].includes(comment.tag);
            const Icon = isNegative ? TriangleAlert : CircleCheck;
            
            return (
              <div key={comment._id} className="bg-surface border border-border rounded-xl p-4 relative group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={isNegative ? 'text-error' : 'text-green-500'} />
                    <span className="font-semibold text-sm text-text-primary">{comment.tag}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteComment(comment._id)}
                    className="text-text-secondary hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {comment.text && (
                  <p className="text-text-primary italic mb-3 text-sm">"{comment.text}"</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-text-secondary mt-2">
                  <div className="flex items-center gap-1">
                    {comment.isPrototypeData ? (
                      <span className="text-text-secondary">Sample rider</span>
                    ) : (
                      <>
                        <BadgeCheck size={14} className="text-primary" />
                        <span>Verified rider</span>
                      </>
                    )}
                  </div>
                  <span>
                    {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-secondary italic text-center p-4">No experiences shared yet.</p>
      )}
    </div>
  );
};

export default CommunityExperiences;
