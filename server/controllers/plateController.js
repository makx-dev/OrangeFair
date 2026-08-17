const Plate = require('../models/Plate');
const Comment = require('../models/Comment');
const Ride = require('../models/Ride');
const Report = require('../models/Report');
const { calculatePlateTrust } = require('../utils/plateTrust');

exports.getPlateDetails = async (req, res) => {
  try {
    const plateNumber = (req.params.plateNumber || '').toUpperCase();
    if (!plateNumber) {
      return res.status(400).json({ message: 'plateNumber is required.' });
    }

    const plate = await Plate.findOneAndUpdate(
      { plateNumber },
      { $setOnInsert: { plateNumber } },
      { new: true, upsert: true }
    );

    const [recentComments, rides, reports] = await Promise.all([
      Comment.find({ plateNumber }).sort({ createdAt: -1 }).limit(5).populate('riderId', 'name'),
      Ride.find({ plateNumber }).sort({ timestamp: -1 }).limit(50).lean(),
      Report.find({ plateNumber }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const trustResult = calculatePlateTrust({ rides, reports });

    plate.trustScore = trustResult.trustScore;
    plate.trustTier = trustResult.trustTier;
    plate.explanation = trustResult.explanation;
    await plate.save();

    const fairFareEstimate = {
      currency: 'INR',
      estimatedMin: 100,
      estimatedMax: 140,
      note: 'Scaffold estimate. Replace with route-based logic.',
    };

    return res.json({
      plateNumber: plate.plateNumber,
      trustScore: plate.trustScore,
      trustTier: plate.trustTier,
      explanation: plate.explanation,
      recentComments,
      fairFareEstimate,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch plate details.', error: error.message });
  }
};
