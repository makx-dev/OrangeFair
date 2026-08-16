const Ride = require('../models/Ride');

exports.getRouteWatch = async (_req, res) => {
  try {
    const hotspotData = await Ride.aggregate([
      {
        $group: {
          _id: { pickup: '$route.pickup', drop: '$route.drop' },
          totalRides: { $sum: 1 },
          averageFare: { $avg: '$fareAmount' },
        },
      },
      { $sort: { totalRides: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          pickup: '$_id.pickup',
          drop: '$_id.drop',
          totalRides: 1,
          averageFare: { $round: ['$averageFare', 2] },
        },
      },
    ]);

    return res.json({
      hotspots: hotspotData,
      note: 'Scaffold aggregation. Replace with overcharging-pattern detection logic.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch Route Watch summary.', error: error.message });
  }
};
