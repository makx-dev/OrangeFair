const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String }, // Optional for Google OAuth users
  googleId: { type: String, unique: true, sparse: true },
  role: {
    type: String,
    enum: ['rider', 'driver', 'admin'],
    default: 'rider',
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en',
    },
    notifications: {
      reportUpdates: { type: Boolean, default: true },
      communityActivity: { type: Boolean, default: true },
      accountNotifications: { type: Boolean, default: true },
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'community', 'private'],
      default: 'community',
    },
    communityActivityVisibility: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);

