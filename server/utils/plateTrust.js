const DEFAULT_BASE_SCORE = 50;
const MAX_ACCURACY_BONUS = 40;
const PATTERN_CONFIRMED_PENALTY = 10;

const normalizeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getTrustTier = (score) => {
  if (score >= 70) return 'Trusted';
  if (score >= 40) return 'Watch';
  return 'Flagged';
};

const getRideEstimate = (ride, rides = []) => {
  if (!ride) return 0;

  const directEstimate = normalizeNumber(ride.fairFareEstimate ?? ride.estimatedFare);
  if (directEstimate > 0) return directEstimate;

  const rideDistances = rides
    .filter((item) => Array.isArray(item?.dropPoints) && item.dropPoints.length > 0)
    .map((item) => item.dropPoints.reduce((sum, point) => sum + normalizeNumber(point.distanceFromPickup), 0));

  const uniqueDistances = [...new Set(rideDistances.filter((distance) => distance > 0))];

  if (uniqueDistances.length === 1 && uniqueDistances[0] > 0) {
    const averageFare = rides.reduce((sum, item) => sum + normalizeNumber(item?.fareAmount), 0) / rides.length;
    if (Number.isFinite(averageFare) && averageFare > 0) {
      return averageFare;
    }
  }

  if (Array.isArray(ride.dropPoints) && ride.dropPoints.length > 0) {
    const totalDistance = ride.dropPoints.reduce((sum, point) => sum + normalizeNumber(point.distanceFromPickup), 0);
    if (totalDistance > 0) {
      return totalDistance * 10;
    }
  }

  return normalizeNumber(ride.fareAmount);
};

function calculatePlateTrust({ rides = [], reports = [] }) {
  const validRides = Array.isArray(rides) ? rides.filter(Boolean) : [];
  const validReports = Array.isArray(reports) ? reports.filter(Boolean) : [];

  if (validRides.length === 0) {
    const trustScore = DEFAULT_BASE_SCORE;
    return {
      trustScore,
      trustTier: getTrustTier(trustScore),
      explanation: 'No logged rides yet. Base trust score starts at 50.',
    };
  }

  let accurateRideCount = 0;

  validRides.forEach((ride) => {
    const fareAmount = normalizeNumber(ride.fareAmount);
    const fairFareEstimate = getRideEstimate(ride, validRides);

    if (fairFareEstimate <= 0) {
      accurateRideCount += 1;
      return;
    }

    const tolerance = fairFareEstimate * 0.1;
    if (Math.abs(fareAmount - fairFareEstimate) <= tolerance) {
      accurateRideCount += 1;
    }
  });

  const accuracyPercent = accurateRideCount / validRides.length;
  const accuracyBonus = Math.min(MAX_ACCURACY_BONUS, accuracyPercent * MAX_ACCURACY_BONUS);
  const patternConfirmedCount = validReports.filter((report) => report.status === 'PatternConfirmed').length;
  const trustScore = Math.max(0, Math.min(100, DEFAULT_BASE_SCORE + accuracyBonus - (patternConfirmedCount * PATTERN_CONFIRMED_PENALTY)));
  const trustTier = getTrustTier(trustScore);

  const explanationParts = [
    `${accurateRideCount} of ${validRides.length} logged rides were within 10% of the fair-fare estimate, adding ${accuracyBonus.toFixed(1)} points.`,
  ];

  if (patternConfirmedCount > 0) {
    explanationParts.push(
      `${patternConfirmedCount} PatternConfirmed report${patternConfirmedCount > 1 ? 's' : ''} reduced the score by ${patternConfirmedCount * PATTERN_CONFIRMED_PENALTY} points.`
    );
  } else {
    explanationParts.push('No PatternConfirmed reports were recorded.');
  }

  return {
    trustScore,
    trustTier,
    explanation: explanationParts.join(' '),
    stats: {
      verifiedRideCount: validRides.length,
      accurateRideCount,
      confirmedReportCount: patternConfirmedCount,
      nearFarePercentage: validRides.length > 0 ? Math.round((accurateRideCount / validRides.length) * 100) : 0,
    }
  };
}

module.exports = {
  calculatePlateTrust,
  getTrustTier,
};
