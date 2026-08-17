const Comment = require('../models/Comment');
const Report = require('../models/Report');
const Ride = require('../models/Ride');
const Plate = require('../models/Plate');

exports.createComment = async (req, res) => {
  try {
    const { plateNumber, linkedReportId, linkedRideId, tag, text, driverReply } = req.body;

    if (!plateNumber || !tag || !text) {
      return res.status(400).json({ message: 'plateNumber, tag, and text are required.' });
    }

    if (!linkedReportId && !linkedRideId) {
      return res.status(400).json({ message: 'Either linkedReportId or linkedRideId is required.' });
    }

    if (!Comment.validateText(text)) {
      return res.status(400).json({
        message: 'Comment text must be under 100 characters and avoid abusive or identifying content.',
      });
    }

    if (driverReply) {
      const normalizedPlate = String(plateNumber).toUpperCase();
      const driverPlate = await Plate.findOne({ plateNumber: normalizedPlate, driverId: req.user.userId }).lean();

      if (req.user.role !== 'driver' || !driverPlate) {
        return res.status(403).json({ message: 'Only the driver associated with the plate may set a driver reply.' });
      }

      if (!Comment.validateDriverReply(driverReply, { userRole: req.user.role, existingReply: '' })) {
        return res.status(400).json({ message: 'Driver reply must be a single, non-empty, safe response from the assigned driver.' });
      }
    }

    if (linkedReportId) {
      const linkedReport = await Report.findOne({ _id: linkedReportId, riderId: req.user.userId }).lean();
      if (!linkedReport) {
        return res.status(403).json({ message: 'You can only comment on a report you filed.' });
      }
      if (String(linkedReport.plateNumber).toUpperCase() !== String(plateNumber).toUpperCase()) {
        return res.status(400).json({ message: 'Report plateNumber does not match the supplied plate number.' });
      }
    }

    if (linkedRideId) {
      const linkedRide = await Ride.findOne({ _id: linkedRideId, riderId: req.user.userId }).lean();
      if (!linkedRide) {
        return res.status(403).json({ message: 'You can only comment on a ride you logged.' });
      }
      if (String(linkedRide.plateNumber).toUpperCase() !== String(plateNumber).toUpperCase()) {
        return res.status(400).json({ message: 'Ride plateNumber does not match the supplied plate number.' });
      }
    }

    const comment = await Comment.create({
      riderId: req.user.userId,
      plateNumber: String(plateNumber).toUpperCase(),
      linkedReportId,
      linkedRideId,
      tag,
      text,
      driverReply,
    });

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add comment.', error: error.message });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverReply } = req.body;

    if (!driverReply || typeof driverReply !== 'string') {
      return res.status(400).json({ message: 'driverReply is required.' });
    }

    if (req.user.role !== 'driver') {
      return res.status(403).json({ message: 'Only drivers can reply to comments.' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (comment.driverReply && String(comment.driverReply).trim()) {
      return res.status(409).json({ message: 'A driver reply has already been submitted for this comment.' });
    }

    const driverPlate = await Plate.findOne({ plateNumber: comment.plateNumber, driverId: req.user.userId }).lean();
    if (!driverPlate) {
      return res.status(403).json({ message: 'Only the driver assigned to this plate may reply.' });
    }

    if (!Comment.validateDriverReply(driverReply, { userRole: req.user.role, existingReply: comment.driverReply })) {
      return res.status(400).json({ message: 'Driver reply must be a single, non-empty, safe response from the assigned driver.' });
    }

    comment.driverReply = driverReply.trim();
    await comment.save();

    return res.json(comment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add driver reply.', error: error.message });
  }
};
