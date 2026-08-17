const Plate = require('../models/Plate');

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboardData = await Plate.aggregate([
      { $match: { trustTier: 'Trusted' } },
      {
        $lookup: {
          from: 'rides',
          localField: 'plateNumber',
          foreignField: 'plateNumber',
          as: 'rides',
        },
      },
      {
        $addFields: {
          verifiedRideCount: { $size: '$rides' },
        },
      },
      { $match: { verifiedRideCount: { $gte: 10 } } }, // Minimum threshold
      {
        $project: {
          _id: 0,
          plateNumber: 1,
          trustScore: 1,
          trustTier: 1,
          verifiedRideCount: 1,
          // Extract accurate rides from the explanation string for demo simplicity
          // or we can just send the explanation directly, but let's parse or just send explanation
          explanation: 1,
        },
      },
      { $sort: { trustScore: -1, verifiedRideCount: -1 } },
      { $limit: 20 },
    ]);

    // Parse the near-expected fare percentage from the explanation for a cleaner UI metric
    const formattedData = leaderboardData.map((plate, index) => {
      let nearFarePct = 100;
      const match = plate.explanation.match(/(\d+) of (\d+) logged rides were within/);
      if (match && match[2] > 0) {
        nearFarePct = Math.round((parseInt(match[1]) / parseInt(match[2])) * 100);
      }

      return {
        rank: index + 1,
        plateNumber: plate.plateNumber,
        trustTier: plate.trustTier,
        verifiedRides: plate.verifiedRideCount,
        nearExpectedFarePct: nearFarePct,
      };
    });

    return res.json({ leaderboard: formattedData });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch leaderboard.', error: error.message });
  }
};
