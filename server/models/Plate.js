const mongoose = require('mongoose');

const plateSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  trustScore: { type: Number, default: 50 },
  trustTier: {
    type: String,
    enum: ['Trusted', 'Watch', 'Flagged'],
    default: 'Watch',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Plate', plateSchema);
