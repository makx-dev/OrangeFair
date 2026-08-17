const FareObservation = require('../models/FareObservation');
const Comment = require('../models/Comment');
const { getRouteKey, calculateFareStatistics, calculateConfidence } = require('../utils/fareIntelligence');

// Note: Official tariff constants for Nagpur (simplified for calculation)
// Base fare for first 1.5km is ~24. Then ~16 per km. (These are indicative)
const calculateOfficialFare = (distanceKm) => {
  if (!distanceKm) return 0;
  if (distanceKm <= 1.5) return 24;
  return Math.round(24 + (distanceKm - 1.5) * 16);
};

exports.getEstimate = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, rideType, distanceKm } = req.query;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng || !rideType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const routeKey = getRouteKey(pickupLat, pickupLng, dropLat, dropLng);

    // Fetch observations for the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const observations = await FareObservation.find({
      routeKey,
      rideType,
      createdAt: { $gte: ninetyDaysAgo }
    });

    const stats = calculateFareStatistics(observations);
    
    // Check if we have only seed data, so we can inform the frontend
    const isSeeded = observations.length > 0 && observations.every(obs => obs.source === 'seed');

    const officialFare = calculateOfficialFare(parseFloat(distanceKm));

    if (!stats) {
      return res.json({
        hasData: false,
        officialFare,
        message: 'Not enough community data yet.'
      });
    }

    const confidence = calculateConfidence(stats.sampleSize);

    res.json({
      hasData: true,
      stats,
      confidence,
      officialFare,
      isSeeded,
      routeKey
    });

  } catch (error) {
    console.error('Error fetching local fare estimate:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.submitObservation = async (req, res) => {
  try {
    const { pickupLocation, dropLocation, rideType, farePaid, distanceKm, vehiclePlate } = req.body;

    if (!pickupLocation || !dropLocation || !rideType || !farePaid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const routeKey = getRouteKey(
      pickupLocation.lat, pickupLocation.lng, 
      dropLocation.lat, dropLocation.lng
    );

    const newObservation = new FareObservation({
      pickupLocation,
      dropLocation,
      routeKey,
      rideType,
      farePaid,
      distanceKm,
      vehiclePlate,
      userId: req.user ? req.user.id : null,
      verifiedRide: !!req.user,
      source: 'community'
    });

    await newObservation.save();
    
    res.status(201).json({ message: 'Fare observation submitted successfully', observation: newObservation });
  } catch (error) {
    console.error('Error submitting fare observation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { routeKey } = req.query;
    if (!routeKey) {
      return res.status(400).json({ error: 'Missing routeKey' });
    }

    const comments = await Comment.find({ routeKey })
      .sort({ createdAt: -1 })
      .limit(10); // Show max 10 comments
      
    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

