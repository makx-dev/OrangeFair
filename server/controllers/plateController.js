const Plate = require('../models/Plate');
const Comment = require('../models/Comment');

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

    const recentComments = await Comment.find({ plateNumber })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('riderId', 'name');

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
      recentComments,
      fairFareEstimate,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch plate details.', error: error.message });
  }
};
