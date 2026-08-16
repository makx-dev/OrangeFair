const Plate = require('../models/Plate');
const Ride = require('../models/Ride');

exports.createRide = async (req, res) => {
  try {
    const { plateNumber, route, fareAmount, passengerCount, dropPoints = [] } = req.body;

    if (!plateNumber || !route?.pickup || !route?.drop || fareAmount == null || !passengerCount) {
      return res.status(400).json({
        message: 'plateNumber, route.pickup, route.drop, fareAmount, and passengerCount are required.',
      });
    }

    await Plate.findOneAndUpdate(
      { plateNumber: plateNumber.toUpperCase() },
      { $setOnInsert: { plateNumber: plateNumber.toUpperCase() } },
      { upsert: true }
    );

    const ride = await Ride.create({
      riderId: req.user.userId,
      plateNumber,
      route,
      fareAmount,
      passengerCount,
      dropPoints,
    });

    return res.status(201).json(ride);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to log ride.', error: error.message });
  }
};

exports.splitRideFare = async (req, res) => {
  const { totalFare, passengerCount, dropPoints } = req.body;

  if (typeof totalFare !== 'number' || totalFare <= 0) {
    return res.status(400).json({ message: 'totalFare must be a positive number.' });
  }

  if (!Number.isInteger(passengerCount) || passengerCount < 1) {
    return res.status(400).json({ message: 'passengerCount must be an integer greater than 0.' });
  }

  if (!Array.isArray(dropPoints) || dropPoints.length !== passengerCount) {
    return res.status(400).json({ message: 'dropPoints must be an array with one entry per passenger.' });
  }

  const normalizedPoints = dropPoints.map((point, index) => {
    const distance = Number(point.distanceFromPickup);
    return {
      rider: point.rider || `Passenger ${index + 1}`,
      dropPoint: point.dropPoint || point.label || `Drop ${index + 1}`,
      distanceFromPickup: distance,
    };
  });

  const invalidDistance = normalizedPoints.some((point) => !Number.isFinite(point.distanceFromPickup) || point.distanceFromPickup <= 0);
  if (invalidDistance) {
    return res.status(400).json({ message: 'Each drop point must include distanceFromPickup > 0.' });
  }

  const totalDistance = normalizedPoints.reduce((sum, point) => sum + point.distanceFromPickup, 0);

  const perRider = normalizedPoints.map((point) => {
    const fairShare = (totalFare * point.distanceFromPickup) / totalDistance;
    return {
      rider: point.rider,
      dropPoint: point.dropPoint,
      distanceFromPickup: point.distanceFromPickup,
      fairShare: Number(fairShare.toFixed(2)),
    };
  });

  const totalAssigned = Number(perRider.reduce((sum, point) => sum + point.fairShare, 0).toFixed(2));

  return res.json({
    totalFare,
    passengerCount,
    totalDistance: Number(totalDistance.toFixed(2)),
    perRider,
    totalAssigned,
    note: 'Proportional split using distance-to-drop allocation.',
  });
};
