const Report = require('../models/Report');
const Plate = require('../models/Plate');

exports.createReport = async (req, res) => {
  try {
    const { plateNumber, rideId, reason, description } = req.body;

    if (!plateNumber || !reason) {
      return res.status(400).json({ message: 'plateNumber and reason are required.' });
    }

    const normalizedPlate = String(plateNumber).toUpperCase();

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
      description,
    });

    const lifecycle = await Report.refreshPlateReportStatuses({ plateNumber: normalizedPlate, reason });
    const updatedReport = await Report.findById(report._id).select('plateNumber reason status createdAt description');

    return res.status(201).json({
      ...updatedReport.toObject(),
      explanation: Report.getLifecycleExplanation(updatedReport.status),
      lifecycle,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to file report.', error: error.message });
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
