const mongoose = require('mongoose');

const getTrustTier = (score) => {
  if (score >= 70) return 'Trusted';
  if (score >= 40) return 'Watch';
  return 'Flagged';
};

const plateSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  trustScore: { type: Number, default: 50 },
  trustTier: {
    type: String,
    enum: ['Trusted', 'Watch', 'Flagged'],
    default: 'Watch',
  },
  explanation: { type: String, default: 'Base trust score starts at 50.' },
  createdAt: { type: Date, default: Date.now },
});

plateSchema.methods.calculateTrust = function calculateTrust(rides = [], reports = []) {
  const validRides = Array.isArray(rides) ? rides.filter(Boolean) : [];
  const validReports = Array.isArray(reports) ? reports.filter(Boolean) : [];

  const baseScore = 50;
  const maxBonus = 40;
  const patternPenalty = 10;

  if (validRides.length === 0) {
    this.trustScore = baseScore;
    this.trustTier = getTrustTier(this.trustScore);
    this.explanation = 'No logged rides yet. Base trust score starts at 50.';
    return this;
  }

  let accurateRideCount = 0;

  validRides.forEach((ride) => {
    const fareAmount = Number(ride.fareAmount) || 0;
    const rideDistances = validRides
      .filter((item) => Array.isArray(item?.dropPoints) && item.dropPoints.length > 0)
      .map((item) => item.dropPoints.reduce((sum, point) => sum + (Number(point.distanceFromPickup) || 0), 0));
    const uniqueDistances = [...new Set(rideDistances.filter((distance) => distance > 0))];

    let estimate = fareAmount;
    if (uniqueDistances.length === 1 && uniqueDistances[0] > 0) {
      const averageFare = validRides.reduce((sum, item) => sum + (Number(item.fareAmount) || 0), 0) / validRides.length;
      estimate = averageFare > 0 ? averageFare : fareAmount;
    } else {
      const totalDistance = Array.isArray(ride.dropPoints)
        ? ride.dropPoints.reduce((sum, point) => sum + (Number(point.distanceFromPickup) || 0), 0)
        : 0;
      estimate = totalDistance > 0 ? totalDistance * 10 : fareAmount;
    }

    const tolerance = estimate * 0.1;
    if (Math.abs(fareAmount - estimate) <= tolerance) {
      accurateRideCount += 1;
    }
  });

  const accuracyRatio = accurateRideCount / validRides.length;
  const accuracyBonus = Math.min(maxBonus, accuracyRatio * maxBonus);
  const confirmedReports = validReports.filter((report) => report.status === 'PatternConfirmed').length;
  const trustScore = Math.max(0, Math.min(100, baseScore + accuracyBonus - confirmedReports * patternPenalty));

  this.trustScore = Number(trustScore.toFixed(1));
  this.trustTier = getTrustTier(this.trustScore);
  this.explanation = `${accurateRideCount} of ${validRides.length} logged rides were within 10% of the fair-fare estimate, and ${confirmedReports} PatternConfirmed report${confirmedReports === 1 ? '' : 's'} adjusted the score.`;

  return this;
};

module.exports = mongoose.model('Plate', plateSchema);
module.exports.getTrustTier = getTrustTier;
