const mongoose = require('mongoose');

const escalationStatuses = [
  'Prepared',
  'User Submitted',
  'Acknowledgement Received',
  'Under Review',
  'Resolved',
  'Closed',
];

const rtoEscalationSchema = new mongoose.Schema({
  escalationId: { type: String, unique: true, required: true, index: true },
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plateNumber: { type: String, required: true, uppercase: true, trim: true, index: true },
  complaintType: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  complaintText: { type: String, required: true },
  incidentDetails: {
    route: { type: String, trim: true },
    observedFare: { type: Number },
    expectedFare: { type: Number },
    incidentDate: { type: Date },
    corroboratingReportsCount: { type: Number, default: 1 },
    evidenceSummary: { type: String },
  },
  status: {
    type: String,
    enum: escalationStatuses,
    default: 'Prepared',
  },
  externalReferenceNumber: { type: String, trim: true },
  submissionDate: { type: Date },
  submittedAt: { type: Date },
  source: { type: String, default: 'orangefair' },
  isPrototypeData: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

rtoEscalationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('RTOEscalation', rtoEscalationSchema);
module.exports.escalationStatuses = escalationStatuses;
