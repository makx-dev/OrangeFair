const Comment = require('../models/Comment');
const Report = require('../models/Report');
const Ride = require('../models/Ride');
const Plate = require('../models/Plate');

exports.createComment = async (req, res) => {
  try {
    const { plateNumber, linkedReportId, linkedRideId, routeKey, tag, text, driverReply } = req.body;

    if (!plateNumber || !tag || !text) {
      return res.status(400).json({ message: 'plateNumber, tag, and text are required.' });
    }

    const normalizedPlate = String(plateNumber).toUpperCase().trim();

    if (!Comment.validateText(text)) {
      return res.status(400).json({
        message: 'Comment text must be under 100 characters and avoid abusive or identifying content.',
      });
    }

    let finalLinkedReportId = linkedReportId;
    let finalLinkedRideId = linkedRideId;

    if (driverReply) {
      const driverPlate = await Plate.findOne({ plateNumber: normalizedPlate, driverId: req.user.userId }).lean();

      if (req.user.role !== 'driver' || !driverPlate) {
        return res.status(403).json({ message: 'Only the driver associated with the plate may set a driver reply.' });
      }

      if (!Comment.validateDriverReply(driverReply, { userRole: req.user.role, existingReply: '' })) {
        return res.status(400).json({ message: 'Driver reply must be a single, non-empty, safe response from the assigned driver.' });
      }
    }

    if (finalLinkedReportId) {
      const linkedReport = await Report.findOne({ _id: finalLinkedReportId, riderId: req.user.userId }).lean();
      if (!linkedReport) {
        return res.status(403).json({ message: 'You can only comment on a report you filed.' });
      }
      if (String(linkedReport.plateNumber).toUpperCase() !== normalizedPlate) {
        return res.status(400).json({ message: 'Report plateNumber does not match the supplied plate number.' });
      }
    } else if (finalLinkedRideId) {
      const linkedRide = await Ride.findOne({ _id: finalLinkedRideId, riderId: req.user.userId }).lean();
      if (!linkedRide) {
        return res.status(403).json({ message: 'You can only comment on a ride you logged.' });
      }
      if (String(linkedRide.plateNumber).toUpperCase() !== normalizedPlate) {
        return res.status(400).json({ message: 'Ride plateNumber does not match the supplied plate number.' });
      }
    } else if (!routeKey) {
      // Auto-link to the user's most recent ride or report for this plate if available
      const [recentRide, recentReport] = await Promise.all([
        Ride.findOne({ riderId: req.user.userId, plateNumber: normalizedPlate }).sort({ timestamp: -1 }),
        Report.findOne({ riderId: req.user.userId, plateNumber: normalizedPlate }).sort({ createdAt: -1 }),
      ]);

      if (recentRide) {
        finalLinkedRideId = recentRide._id;
      } else if (recentReport) {
        finalLinkedReportId = recentReport._id;
      } else {
        // Create an associated community ride record for this observation
        const newRide = await Ride.create({
          riderId: req.user.userId,
          plateNumber: normalizedPlate,
          route: { pickup: 'Verified Nagpur Route', drop: 'Local Destination' },
          fareAmount: 30,
          passengerCount: 1,
        });
        finalLinkedRideId = newRide._id;
      }
    }

    const comment = await Comment.create({
      riderId: req.user.userId,
      plateNumber: normalizedPlate,
      linkedReportId: finalLinkedReportId,
      linkedRideId: finalLinkedRideId,
      routeKey,
      tag,
      text: text.trim(),
      driverReply: driverReply ? driverReply.trim() : undefined,
      status: 'visible',
      source: 'community',
      isPrototypeData: false,
    });

    const populatedComment = await Comment.findById(comment._id).populate('riderId', 'name role');

    return res.status(201).json(populatedComment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add comment.', error: error.message });
  }
};

exports.getMyComments = async (req, res) => {
  try {
    const comments = await Comment.find({ riderId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('riderId', 'name role')
      .populate('linkedReportId', 'reason status')
      .lean();

    return res.json({ comments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch your comments.', error: error.message });
  }
};

exports.getPlateComments = async (req, res) => {
  try {
    const normalizedPlate = String(req.params.plateNumber || '').toUpperCase().trim();
    if (!normalizedPlate) {
      return res.status(400).json({ message: 'plateNumber is required.' });
    }

    const comments = await Comment.find({
      plateNumber: normalizedPlate,
      status: { $ne: 'removed' },
    })
      .sort({ createdAt: -1 })
      .populate('riderId', 'name role')
      .lean();

    return res.json({ comments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch comments for plate.', error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag, text } = req.body;

    if (!tag || !text) {
      return res.status(400).json({ message: 'tag and text are required.' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Backend ownership validation
    if (String(comment.riderId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You do not have permission to edit this comment.' });
    }

    if (!Comment.validateText(text)) {
      return res.status(400).json({
        message: 'Comment text must be under 100 characters and avoid abusive or identifying content.',
      });
    }

    comment.tag = tag;
    comment.text = text.trim();
    comment.updatedAt = new Date();

    await comment.save();

    const updated = await Comment.findById(id).populate('riderId', 'name role');
    return res.json({ message: 'Comment updated successfully.', comment: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update comment.', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Backend ownership validation
    if (String(comment.riderId) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'You do not have permission to delete this comment.' });
    }

    await Comment.findByIdAndDelete(id);

    return res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete comment.', error: error.message });
  }
};

exports.reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Move to moderation state without deleting
    comment.status = 'under_review';
    await comment.save();

    return res.json({ message: 'Comment reported and placed under moderation review.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to report comment.', error: error.message });
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

    const updated = await Comment.findById(id).populate('riderId', 'name role');
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add driver reply.', error: error.message });
  }
};

