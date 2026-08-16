const mongoose = require('mongoose');

const dropPointSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    distanceFromPickup: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plateNumber: { type: String, required: true, uppercase: true, trim: true },
  route: {
    pickup: { type: String, required: true, trim: true },
    drop: { type: String, required: true, trim: true },
  },
  fareAmount: { type: Number, required: true, min: 0 },
  passengerCount: { type: Number, required: true, min: 1 },
  dropPoints: { type: [dropPointSchema], default: [] },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Ride', rideSchema);
