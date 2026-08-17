const mongoose = require('mongoose');

const reasonValues = [
  'Overcharged',
  'Refused Meter',
  'Rude',
  'Safe Driving',
  'Used Meter',
  'Refused Short Trip',
];

const lifecycleMessages = {
  Submitted: 'The report is in the queue and waiting for a pattern check.',
  UnderReview: 'The report is under review while similar complaints are being compared.',
  PatternConfirmed: 'Three or more similar reports in 30 days confirm a repeated pattern for this plate.',
  Flagged: 'This plate has been flagged after corroborated issues and should be watched closely.',
};

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
  source: { type: String, enum: ['community', 'seed'], default: 'community' },
  isPrototypeData: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.statics.getStatusForReportCount = function getStatusForReportCount(count) {
  if (count >= 3) return 'PatternConfirmed';
  if (count >= 1) return 'UnderReview';
  return 'Submitted';
};

reportSchema.statics.getLifecycleExplanation = function getLifecycleExplanation(status) {
  return lifecycleMessages[status] || 'The report is in the review process.';
};

reportSchema.statics.refreshPlateReportStatuses = async function refreshPlateReportStatuses({ plateNumber, reason }) {
  const normalizedPlate = String(plateNumber || '').toUpperCase();
  if (!normalizedPlate || !reason) return { count: 0, status: 'Submitted' };

  const timeWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const matchingReports = await this.find({
    plateNumber: normalizedPlate,
    reason,
    createdAt: { $gte: timeWindow },
  }).sort({ createdAt: 1 });

  const nextStatus = this.getStatusForReportCount(matchingReports.length);

  if (matchingReports.length > 0) {
    await this.updateMany(
      {
        plateNumber: normalizedPlate,
        reason,
        createdAt: { $gte: timeWindow },
      },
      { $set: { status: nextStatus } }
    );
  }

  return { count: matchingReports.length, status: nextStatus };
};

module.exports = mongoose.model('Report', reportSchema);
module.exports.reasonValues = reasonValues;
module.exports.lifecycleMessages = lifecycleMessages;
