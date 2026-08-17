const mongoose = require('mongoose');

const tagValues = [
  'Overcharged',
  'Refused Meter',
  'Rude',
  'Safe Driving',
  'Used Meter',
  'Refused Short Trip',
];

const blockedKeywords = /(idiot|moron|stupid|loser|fraud|scam|liar|cheat|fake|shame)/i;
const identityKeywords = /(phone|email|address|name|contact details|aadhaar|pan|passport)/i;

const commentSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plateNumber: { type: String, required: true, uppercase: true, trim: true },
  linkedReportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  linkedRideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  tag: { type: String, enum: tagValues, required: true },
  text: { type: String, required: true, maxlength: 100, trim: true },
  driverReply: { type: String, maxlength: 200, trim: true },
  createdAt: { type: Date, default: Date.now },
});

commentSchema.statics.validateText = function validateText(text) {
  if (typeof text !== 'string') return false;

  const cleaned = text.trim();
  if (!cleaned || cleaned.length > 100) return false;
  if (blockedKeywords.test(cleaned) || identityKeywords.test(cleaned)) return false;

  return true;
};

commentSchema.statics.validateDriverReply = function validateDriverReply(reply, { userRole, existingReply } = {}) {
  if (typeof reply !== 'string') return false;

  const cleaned = reply.trim();
  if (!cleaned || cleaned.length > 200) return false;
  if (userRole !== 'driver') return false;
  if (existingReply && String(existingReply).trim()) return false;
  if (blockedKeywords.test(cleaned) || identityKeywords.test(cleaned)) return false;

  return true;
};

commentSchema.pre('validate', function ensureLinkedEntity(next) {
  if (!this.linkedReportId && !this.linkedRideId) {
    this.invalidate('linkedReportId', 'Either linkedReportId or linkedRideId is required.');
  }

  if (this.text && !this.constructor.validateText(this.text)) {
    this.invalidate('text', 'Comment text must be under 100 characters and avoid abusive or identifying content.');
  }

  if (this.driverReply && !this.constructor.validateDriverReply(this.driverReply, { userRole: 'driver', existingReply: this.driverReply })) {
    this.invalidate('driverReply', 'Driver reply must be a unique, non-empty response under 200 characters and may only be posted by a driver.');
  }

  next();
});

module.exports = mongoose.model('Comment', commentSchema);
module.exports.tagValues = tagValues;
