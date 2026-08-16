import { Link } from 'react-router-dom';

export default function QuickActionCard({ title, description, to, cta }) {
  return (
    <article className="rounded-xl border border-primary/20 p-6">
      <h3 className="text-lg font-semibold text-dark">{title}</h3>
      <p className="mt-2 text-sm text-dark/70">{description}</p>
      <Link to={to} className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface">
        {cta}
      </Link>
    </article>
  );
}
