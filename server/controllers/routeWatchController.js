const Ride = require('../models/Ride');

exports.getRouteWatch = async (_req, res) => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const hotspotData = await Ride.aggregate([
      { $match: { timestamp: { $gte: fourteenDaysAgo } } },
      {
        $addFields: {
          totalDistance: {
            $sum: '$dropPoints.distanceFromPickup'
          }
        }
      },
      {
        $addFields: {
          estimatedFare: {
            $cond: [
              { $gt: ['$totalDistance', 0] },
              { $multiply: ['$totalDistance', 10] }, // fallback formula used in Trust
              '$fareAmount'
            ]
          }
        }
      },
      {
        $addFields: {
          deviationPct: {
            $multiply: [
              { $divide: [ { $subtract: ['$fareAmount', '$estimatedFare'] }, '$estimatedFare' ] },
              100
            ]
          }
        }
      },
      {
        $group: {
          _id: { pickup: '$route.pickup', drop: '$route.drop' },
          totalRides: { $sum: 1 },
          averageFare: { $avg: '$fareAmount' },
          avgDeviationPct: { $avg: '$deviationPct' },
        },
      },
      { $match: { avgDeviationPct: { $gt: 5 } } }, // only show routes consistently overcharged by >5%
      { $sort: { avgDeviationPct: -1, totalRides: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          pickup: '$_id.pickup',
          drop: '$_id.drop',
          totalRides: 1,
          averageFare: { $round: ['$averageFare', 2] },
          deviationPct: { $round: ['$avgDeviationPct', 1] },
        },
      },
    ]);

    return res.json({ hotspots: hotspotData });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch Route Watch summary.', error: error.message });
  }
};
