const mongoose = require('mongoose');

const tagValues = [
  'Overcharged',
  'Refused Meter',
  'Rude',
  'Safe Driving',
  'Used Meter',
  'Refused Short Trip',
];

const commentSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plateNumber: { type: String, required: true, uppercase: true, trim: true },
  linkedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  linkedRideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  tag: { type: String, enum: tagValues, required: true },
  text: { type: String, required: true, maxlength: 100, trim: true },
  driverReply: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

commentSchema.pre('validate', function ensureLinkedEntity(next) {
  if (!this.linkedReportId && !this.linkedRideId) {
    this.invalidate('linkedReportId', 'Either linkedReportId or linkedRideId is required.');
  }
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
module.exports.tagValues = tagValues;
