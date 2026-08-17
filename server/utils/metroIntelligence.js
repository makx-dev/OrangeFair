const { stations, METRO_FARE_CONFIG } = require('../seed/metroData');

// Haversine formula to calculate distance in km between two lat/lngs
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find the closest metro station within a reasonable access distance
const findNearbyMetroStation = (lat, lng) => {
  let closestStation = null;
  let minDistance = Infinity;

  for (const station of stations) {
    const distance = calculateDistance(lat, lng, station.latitude, station.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      closestStation = station;
    }
  }

  // We allow up to 3km access distance (could be walk or short auto) to consider a station "nearby" for the prototype
  // This helps ensure we show the card for demo routes where they might need a short auto.
  if (minDistance <= 3.0) {
    return { station: closestStation, distance: minDistance };
  }

  return null;
};

const calculateMetroCost = (distanceKm) => {
  const fare = METRO_FARE_CONFIG.BASE_FARE + (distanceKm * METRO_FARE_CONFIG.PER_KM_RATE);
  // Round to nearest 5
  const roundedFare = Math.round(Math.min(fare, METRO_FARE_CONFIG.MAX_FARE) / 5) * 5;
  return Math.max(METRO_FARE_CONFIG.BASE_FARE, roundedFare);
};

const getSmartRecommendation = (pickupLat, pickupLng, dropLat, dropLng, localAutoFare, autoDistanceKm) => {
  const originResult = findNearbyMetroStation(pickupLat, pickupLng);
  const destResult = findNearbyMetroStation(dropLat, dropLng);

  if (!originResult || !destResult) {
    return { isPractical: false, reason: "No nearby stations" };
  }

  if (originResult.station.name === destResult.station.name) {
    return { isPractical: false, reason: "Same station" };
  }

  const accessDistance = originResult.distance;
  const exitDistance = destResult.distance;

  // Metro journey distance
  const metroDistance = calculateDistance(
    originResult.station.latitude, originResult.station.longitude,
    destResult.station.latitude, destResult.station.longitude
  );

  // Metro path check
  // For the prototype, we assume if both are on the network, there is a path.

  // Cost calculations
  let firstMileCost = 0;
  let lastMileCost = 0;
  let firstMileMode = 'walk';
  let lastMileMode = 'walk';

  if (accessDistance > METRO_FARE_CONFIG.MAX_WALKING_DISTANCE_KM) {
    firstMileCost = METRO_FARE_CONFIG.AUTO_SHORT_TRIP_FARE;
    firstMileMode = 'auto';
  }

  if (exitDistance > METRO_FARE_CONFIG.MAX_WALKING_DISTANCE_KM) {
    lastMileCost = METRO_FARE_CONFIG.AUTO_SHORT_TRIP_FARE;
    lastMileMode = 'auto';
  }

  const metroFare = calculateMetroCost(metroDistance);
  const alternativeCost = firstMileCost + metroFare + lastMileCost;

  // Time calculations
  const firstMileTime = (accessDistance / (firstMileMode === 'walk' ? METRO_FARE_CONFIG.WALK_SPEED_KMPH : METRO_FARE_CONFIG.AUTO_SPEED_KMPH)) * 60;
  const lastMileTime = (exitDistance / (lastMileMode === 'walk' ? METRO_FARE_CONFIG.WALK_SPEED_KMPH : METRO_FARE_CONFIG.AUTO_SPEED_KMPH)) * 60;
  const metroTime = (metroDistance / METRO_FARE_CONFIG.METRO_SPEED_KMPH) * 60;

  // Assume 5 mins transfer/wait time
  const totalAlternativeTime = Math.round(firstMileTime + metroTime + lastMileTime + 5);
  const autoTime = Math.round((autoDistanceKm / METRO_FARE_CONFIG.AUTO_SPEED_KMPH) * 60);

  const saving = localAutoFare - alternativeCost;

  // It's a meaningful alternative if it saves money or saves significant time
  // But the requirement says "Metro should provide a meaningful benefit in cost, or cost + practicality"
  return {
    isPractical: true,
    alternativeCost,
    saving,
    totalAlternativeTime,
    autoTime,
    metroFare,
    firstMileMode,
    lastMileMode,
    firstMileCost,
    lastMileCost,
    isCheaper: saving > 0,
    isFaster: totalAlternativeTime < autoTime,
    timeDifference: Math.abs(totalAlternativeTime - autoTime)
  };
};

module.exports = {
  findNearbyMetroStation,
  calculateDistance,
  getSmartRecommendation
};
