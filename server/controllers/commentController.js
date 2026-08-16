const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  try {
    const { plateNumber, linkedReportId, linkedRideId, tag, text, driverReply } = req.body;

    if (!plateNumber || !tag || !text) {
      return res.status(400).json({ message: 'plateNumber, tag, and text are required.' });
    }

    if (!linkedReportId && !linkedRideId) {
      return res.status(400).json({ message: 'Either linkedReportId or linkedRideId is required.' });
    }

    const comment = await Comment.create({
      riderId: req.user.userId,
      plateNumber,
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
