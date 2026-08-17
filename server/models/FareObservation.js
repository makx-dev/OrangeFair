const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const fareObservationSchema = new mongoose.Schema({
  pickupLocation: { type: LocationSchema, required: true },
  dropLocation: { type: LocationSchema, required: true },
  routeKey: { type: String, required: true, index: true },
  rideType: { type: String, enum: ['private', 'shared'], required: true },
  farePaid: { type: Number, required: true },
  distanceKm: { type: Number },
  vehiclePlate: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedRide: { type: Boolean, default: false },
  source: { type: String, enum: ['community', 'seed'], default: 'community' },
  isPrototypeData: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FareObservation', fareObservationSchema);
