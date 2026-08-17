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
  try {
    const { dropPoints } = req.body;

    // dropPoints should be an array ordered by drop sequence
    // each item: { passengerCount: number, dropPoint: string, cumulativeDistance: number }

    if (!Array.isArray(dropPoints) || dropPoints.length === 0) {
      return res.status(400).json({ message: 'dropPoints array is required.' });
    }

    const totalPassengers = dropPoints.reduce((sum, p) => sum + (Number(p.passengerCount) || 1), 0);
    
    // Sort just in case, but they should be in order of drop off
    const sortedPoints = [...dropPoints].sort((a, b) => a.cumulativeDistance - b.cumulativeDistance);

    const invalidDistance = sortedPoints.some((point) => !Number.isFinite(point.cumulativeDistance) || point.cumulativeDistance < 0);
    if (invalidDistance) {
      return res.status(400).json({ message: 'Each drop point must include a valid cumulativeDistance >= 0.' });
    }

    // Tariff rules
    const minimumFare = 26;
    const ratePerKm = 17.14;
    const nightSurcharge = 0.25;

    // Helper to calculate meter fare at a specific distance
    const calculateMeterFareAtDistance = (distanceKm) => {
      if (distanceKm <= 0) return 0;
      let baseFare = minimumFare;
      if (distanceKm > 1.5) {
        baseFare += (distanceKm - 1.5) * ratePerKm;
      }
      return baseFare; // We will handle rounding later
    };

    // Calculate incremental segment fares
    let previousDistance = 0;
    let previousMeterFare = 0;
    let activePassengers = totalPassengers;
    let accumulatedSharePerPerson = 0;

    for (let i = 0; i < sortedPoints.length; i++) {
      const currentDistance = sortedPoints[i].cumulativeDistance;
      const currentMeterFare = calculateMeterFareAtDistance(currentDistance);
      
      const segmentFare = currentMeterFare - previousMeterFare;
      
      // Share per person for this segment
      const eachPassengerShareForSegment = segmentFare / activePassengers;
      accumulatedSharePerPerson += eachPassengerShareForSegment;

      const pCount = Number(sortedPoints[i].passengerCount) || 1;
      // Subtract these passengers so they don't pay for the next segment
      activePassengers -= pCount;

      sortedPoints[i]._fairSharePerPerson = accumulatedSharePerPerson;
      sortedPoints[i]._groupFairShare = accumulatedSharePerPerson * pCount;

      previousDistance = currentDistance;
      previousMeterFare = currentMeterFare;
    }

    const totalDistance = sortedPoints[sortedPoints.length - 1].cumulativeDistance;
    const totalMeterFare = Math.round(calculateMeterFareAtDistance(totalDistance));

    const perDestination = sortedPoints.map((point) => {
      return {
        dropPoint: point.dropPoint,
        passengerCount: Number(point.passengerCount) || 1,
        distanceFromPickup: point.cumulativeDistance,
        fairSharePerPerson: Number(point._fairSharePerPerson.toFixed(2)),
        groupFairShare: Number(point._groupFairShare.toFixed(2)),
      };
    });

    const sumOfShares = Number(perDestination.reduce((sum, dest) => sum + dest.groupFairShare, 0).toFixed(2));

    return res.json({
      totalPassengers,
      totalDistance: Number(totalDistance.toFixed(2)),
      perDestination,
      totalAssigned: sumOfShares,
      officialFare: totalMeterFare,
      note: 'Fare split calculated based on incremental route distance and passenger occupancy for each segment.',
    });

  } catch (error) {
    console.error("Error in splitRideFare:", error);
    return res.status(500).json({ message: 'Internal server error during fare calculation.' });
  }
};