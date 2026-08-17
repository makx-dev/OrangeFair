const Plate = require('../models/Plate');
const Comment = require('../models/Comment');
const Ride = require('../models/Ride');
const Report = require('../models/Report');
const { calculatePlateTrust } = require('../utils/plateTrust');
const { verifyVehicleRegistration } = require('../utils/vehicleVerificationService');

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

    // Check if verification is needed (missing or older than 24 hours)
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const needsVerification = !plate.lastVerifiedAt || (Date.now() - plate.lastVerifiedAt.getTime() > ONE_DAY);
    
    if (needsVerification) {
      const verificationResult = await verifyVehicleRegistration(plate.plateNumber);
      plate.verificationStatus = verificationResult.verified;
      plate.verificationSource = verificationResult.source;
      plate.lastVerifiedAt = verificationResult.lastVerifiedAt;
      if (verificationResult.verified) {
        plate.verifiedVehicleData = verificationResult.vehicle;
      }
    }

    await plate.save();

    const fairFareEstimate = {
      currency: 'INR',
      estimatedMin: 100,
      estimatedMax: 140,
      note: 'Scaffold estimate. Replace with route-based logic.',
    };

    return res.json({
      vehicle: {
        registrationNumber: plate.plateNumber,
        ...(plate.verifiedVehicleData || {}),
      },
      verification: {
        verified: plate.verificationStatus,
        source: plate.verificationSource,
        lastVerifiedAt: plate.lastVerifiedAt,
      },
      trust: {
        score: plate.trustScore,
        tier: plate.trustTier,
        explanation: plate.explanation,
        stats: trustResult.stats || { verifiedRideCount: 0, confirmedReportCount: 0, nearFarePercentage: 0 }
      },
      recentComments,
      fairFareEstimate,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch plate details.', error: error.message });
  }
};
