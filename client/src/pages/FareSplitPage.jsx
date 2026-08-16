import { useState } from 'react';
import { splitFare } from '../api/endpoints';

function buildPoints(count) {
  return Array.from({ length: count }, (_, index) => ({
    rider: `Passenger ${index + 1}`,
    dropPoint: `Drop ${index + 1}`,
    distanceFromPickup: '',
  }));
}

export default function FareSplitPage() {
  const [totalFare, setTotalFare] = useState('');
  const [passengerCount, setPassengerCount] = useState(2);
  const [dropPoints, setDropPoints] = useState(buildPoints(2));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const updatePassengerCount = (value) => {
    const parsed = Math.max(1, Number(value) || 1);
    setPassengerCount(parsed);
    setDropPoints(buildPoints(parsed));
    setResult(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const payload = {
        totalFare: Number(totalFare),
        passengerCount,
        dropPoints: dropPoints.map((point) => ({ ...point, distanceFromPickup: Number(point.distanceFromPickup) })),
      };
      const response = await splitFare(payload);
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to split fare.');
      setResult(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Multi-passenger fair split</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-primary/20 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Total Fare (₹)
            <input
              type="number"
              min="1"
              value={totalFare}
              onChange={(event) => setTotalFare(event.target.value)}
              className="mt-1 w-full rounded-md border border-primary/30 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Passenger count
            <input
              type="number"
              min="1"
              value={passengerCount}
              onChange={(event) => updatePassengerCount(event.target.value)}
              className="mt-1 w-full rounded-md border border-primary/30 px-3 py-2"
            />
          </label>
        </div>

        <div className="space-y-3">
          {dropPoints.map((point, index) => (
            <div key={point.rider} className="grid gap-3 md:grid-cols-3">
              <input
                value={point.rider}
                onChange={(event) =>
                  setDropPoints((prev) => prev.map((item, i) => (i === index ? { ...item, rider: event.target.value } : item)))
                }
                className="rounded-md border border-primary/30 px-3 py-2"
                placeholder="Rider name"
              />
              <input
                value={point.dropPoint}
                onChange={(event) =>
                  setDropPoints((prev) => prev.map((item, i) => (i === index ? { ...item, dropPoint: event.target.value } : item)))
                }
                className="rounded-md border border-primary/30 px-3 py-2"
                placeholder="Drop point"
              />
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={point.distanceFromPickup}
                onChange={(event) =>
                  setDropPoints((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, distanceFromPickup: event.target.value } : item))
                  )
                }
                className="rounded-md border border-primary/30 px-3 py-2"
                placeholder="Distance from pickup"
              />
            </div>
          ))}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" className="rounded-md bg-primary px-5 py-2 font-medium text-surface">
          Calculate fair split
        </button>
      </form>

      {result ? (
        <section className="space-y-3 rounded-xl border border-accent/40 p-6">
          <h2 className="text-xl font-semibold">Fair share results</h2>
          {result.perRider.map((item) => (
            <div key={`${item.rider}-${item.dropPoint}`} className="rounded-md border border-dark/15 p-3 text-sm">
              <p className="font-medium">{item.rider}</p>
              <p>Drop: {item.dropPoint}</p>
              <p>Distance: {item.distanceFromPickup}</p>
              <p>Fair share: ₹{item.fairShare}</p>
            </div>
          ))}
          <p className="font-medium">Total assigned: ₹{result.totalAssigned}</p>
        </section>
      ) : null}
    </div>
  );
}
