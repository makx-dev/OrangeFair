const tierStyles = {
  Trusted: 'bg-primary text-surface',
  Watch: 'bg-accent text-dark',
  Flagged: 'bg-dark text-surface',
};

export default function TrustBadge({ tier = 'Watch', score = 50 }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${tierStyles[tier] || tierStyles.Watch}`}>
      <span>{tier}</span>
      <span className="rounded-full bg-surface/30 px-2 py-0.5 text-xs">Score {score}</span>
    </div>
  );
}
