import React, { useState, useEffect } from 'react';
import { BadgeCheck, CircleCheck, TriangleAlert, Loader2 } from 'lucide-react';
import axios from '../../api/axios';

const CommunityExperiences = ({ routeKey }) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (!routeKey) return;
      setIsLoading(true);
      try {
        const response = await axios.get('/local-fare/comments', { params: { routeKey } });
        setComments(response.data.comments || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [routeKey]);

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

  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
        Community Experiences
      </h3>
      
      <div className="space-y-3">
        {comments.map((comment) => {
          // Determine icon based on tag
          const isNegative = ['Overcharged', 'Refused Meter', 'Rude'].includes(comment.tag);
          const Icon = isNegative ? TriangleAlert : CircleCheck;
          
          return (
            <div key={comment._id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={isNegative ? 'text-error' : 'text-green-500'} />
                <span className="font-semibold text-sm text-text-primary">{comment.tag}</span>
              </div>
              
              {comment.text && (
                <p className="text-text-primary italic mb-3">"{comment.text}"</p>
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
    </div>
  );
};

export default CommunityExperiences;
