const Report = require('../models/Report');
const Plate = require('../models/Plate');

exports.createReport = async (req, res) => {
  try {
    const { plateNumber, rideId, reason, description } = req.body;

    if (!plateNumber || !reason) {
      return res.status(400).json({ message: 'plateNumber and reason are required.' });
    }

    await Plate.findOneAndUpdate(
      { plateNumber: plateNumber.toUpperCase() },
      { $setOnInsert: { plateNumber: plateNumber.toUpperCase() } },
      { upsert: true }
    );

    const report = await Report.create({
      riderId: req.user.userId,
      plateNumber,
      rideId,
      reason,
      description,
    });

    return res.status(201).json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to file report.', error: error.message });
  }
};

exports.getReportStatus = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).select('plateNumber reason status createdAt');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch report status.', error: error.message });
  }
};
