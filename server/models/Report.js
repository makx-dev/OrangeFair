const mongoose = require('mongoose');

const reasonValues = [
  'Overcharged',
  'Refused Meter',
  'Rude',
  'Safe Driving',
  'Used Meter',
  'Refused Short Trip',
];

const reportSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plateNumber: { type: String, required: true, uppercase: true, trim: true },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  reason: { type: String, enum: reasonValues, required: true },
  description: { type: String, maxlength: 100, trim: true },
  status: {
    type: String,
    enum: ['Submitted', 'UnderReview', 'PatternConfirmed', 'Flagged'],
    default: 'Submitted',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);
module.exports.reasonValues = reasonValues;
