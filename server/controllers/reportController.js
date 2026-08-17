const Report = require('../models/Report');
const Plate = require('../models/Plate');
const Ride = require('../models/Ride');

exports.createReport = async (req, res) => {
  try {
    const { plateNumber, rideId, reason, description } = req.body;

    if (!plateNumber || !reason) {
      return res.status(400).json({ message: 'plateNumber and reason are required.' });
    }

    const normalizedPlate = String(plateNumber).toUpperCase().trim();

    await Plate.findOneAndUpdate(
      { plateNumber: normalizedPlate },
      { $setOnInsert: { plateNumber: normalizedPlate } },
      { upsert: true }
    );

    const report = await Report.create({
      riderId: req.user.userId,
      plateNumber: normalizedPlate,
      rideId,
      reason,
      description: description ? description.trim() : '',
      source: 'community',
      isPrototypeData: false,
    });

    const lifecycle = await Report.refreshPlateReportStatuses({ plateNumber: normalizedPlate, reason });
    const updatedReport = await Report.findById(report._id).select('plateNumber reason status createdAt description riderId');

    return res.status(201).json({
      ...updatedReport.toObject(),
      reportCode: `#OF-${String(updatedReport._id).slice(-4).toUpperCase()}`,
      explanation: Report.getLifecycleExplanation(updatedReport.status),
      lifecycle,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to file report.', error: error.message });
  }
};

exports.getMyReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { riderId: req.user.userId };

    if (status && status !== 'All') {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate('rideId')
      .lean();

    const formattedReports = reports.map((r) => ({
      ...r,
      reportCode: `#OF-${String(r._id).slice(-4).toUpperCase()}`,
      explanation: Report.getLifecycleExplanation(r.status),
    }));

    return res.json({ reports: formattedReports });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch your reports.', error: error.message });
  }
};

exports.getReportDetail = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('riderId', 'name email')
      .populate('rideId')
      .lean();

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const normalizedPlate = String(report.plateNumber).toUpperCase();
    const timeWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const corroboratingCount = await Report.countDocuments({
      plateNumber: normalizedPlate,
      reason: report.reason,
      createdAt: { $gte: timeWindow },
    });

    const plate = await Plate.findOne({ plateNumber: normalizedPlate }).lean();

    const isEligibleForRto =
      report.status === 'PatternConfirmed' ||
      report.status === 'Flagged' ||
      corroboratingCount >= 3;

    let trustContributionExplanation = null;
    if (report.status === 'PatternConfirmed' || report.status === 'Flagged' || corroboratingCount >= 3) {
      trustContributionExplanation = "This report contributed to the vehicle's community trust status.";
    }

    return res.json({
      _id: report._id,
      reportCode: `#OF-${String(report._id).slice(-4).toUpperCase()}`,
      plateNumber: report.plateNumber,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      rider: report.riderId,
      ride: report.rideId,
      isOwner: req.user ? String(report.riderId?._id || report.riderId) === String(req.user.userId) : false,
      corroboratingCount,
      isEligibleForRto,
      trustContributionExplanation,
      plateTrustTier: plate?.trustTier || 'Watch',
      plateTrustScore: plate?.trustScore || 50,
      explanation: Report.getLifecycleExplanation(report.status),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch report detail.', error: error.message });
  }
};

exports.getReportStatus = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select('plateNumber reason status createdAt description');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    return res.json({
      _id: report._id,
      reportCode: `#OF-${String(report._id).slice(-4).toUpperCase()}`,
      plateNumber: report.plateNumber,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
      description: report.description,
      explanation: Report.getLifecycleExplanation(report.status),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch report status.', error: error.message });
  }
};

