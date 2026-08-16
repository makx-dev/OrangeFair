import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TrustBadge from '../components/TrustBadge';
import { getPlate } from '../api/endpoints';

export default function PlateDetailPage() {
  const { plateNumber } = useParams();
  const [plate, setPlate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlate = async () => {
      try {
        const response = await getPlate(plateNumber);
        setPlate(response.data);
        setError('');
      } catch {
        setError('Could not load plate data.');
      }
    };

    fetchPlate();
  }, [plateNumber]);

  if (error) {
    return <p className="mx-auto max-w-4xl px-6 py-10 text-red-600">{error}</p>;
  }

  if (!plate) {
    return <p className="mx-auto max-w-4xl px-6 py-10 text-dark/70">Loading plate details...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Plate: {plate.plateNumber}</h1>
      <TrustBadge tier={plate.trustTier} score={plate.trustScore} />

      <section className="rounded-xl border border-primary/20 p-6">
        <h2 className="text-xl font-semibold">Fair-fare estimate</h2>
        <p className="mt-2 text-dark/80">
          ₹{plate.fairFareEstimate.estimatedMin} - ₹{plate.fairFareEstimate.estimatedMax} {plate.fairFareEstimate.currency}
        </p>
        <p className="mt-1 text-sm text-dark/60">{plate.fairFareEstimate.note}</p>
      </section>

      <section className="rounded-xl border border-primary/20 p-6">
        <h2 className="text-xl font-semibold">Verified comments</h2>
        {plate.recentComments.length === 0 ? (
          <p className="mt-3 text-sm text-dark/70">No comments yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {plate.recentComments.map((comment) => (
              <li key={comment._id} className="rounded-md border border-dark/15 p-3 text-sm">
                <p className="font-medium">{comment.tag}</p>
                <p className="text-dark/80">{comment.text}</p>
                <p className="text-dark/60">By: {comment.riderId?.name || 'Rider'}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/dashboard" className="inline-block rounded-md bg-accent px-4 py-3 font-medium text-dark">
        Report this driver
      </Link>
    </div>
  );
}
