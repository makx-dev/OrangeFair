import React from 'react';
import { BadgeCheck, CircleCheck, TriangleAlert } from 'lucide-react';

const DUMMY_COMMENTS = [
  {
    id: 1,
    tag: 'Fair fare',
    icon: CircleCheck,
    text: 'Used meter and fare matched the estimate.',
    verified: true,
    time: '2 days ago',
    type: 'positive'
  },
  {
    id: 2,
    tag: 'Overcharged',
    icon: TriangleAlert,
    text: 'Asked ₹40 for a route usually around ₹25–30.',
    verified: true,
    time: '5 days ago',
    type: 'negative'
  }
];

const CommunityExperiences = ({ routeKey }) => {
  // In a real implementation, we would fetch comments for the routeKey
  // For the prototype, we use realistic dummy comments
  const comments = DUMMY_COMMENTS;

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
          const Icon = comment.icon;
          return (
            <div key={comment.id} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={comment.type === 'positive' ? 'text-green-500' : 'text-error'} />
                <span className="font-semibold text-sm text-text-primary">{comment.tag}</span>
              </div>
              
              {comment.text && (
                <p className="text-text-primary italic mb-3">"{comment.text}"</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-text-secondary mt-2">
                <div className="flex items-center gap-1">
                  {comment.verified && <BadgeCheck size={14} className="text-primary" />}
                  <span>Verified rider</span>
                </div>
                <span>{comment.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityExperiences;
