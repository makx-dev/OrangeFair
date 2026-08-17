// Maharashtra Motor Vehicle Department Auto-Rickshaw Tariff (effective 01/02/2025)
export const AUTO_FARE_CONFIG = {
  minimumFare: 26, // For first 1.5 km
  ratePerKm: 17.14,
  nightSurcharge: 0.25, // 25%
  nightStart: "00:00",
  nightEnd: "05:00",
  thresholds: {
    close: 0.10, // <= 10% is close
    elevated: 0.20, // 10-20% is elevated, > 20% is significantly above
  }
};

export const isNightTime = (date = new Date()) => {
  const hours = date.getHours();
  // 00:00 to 05:00 is night time (0 to 4.99 hours)
  return hours >= 0 && hours < 5;
};

// Calculates total official meter fare for a given distance from pickup
export const calculateMeterFareAtDistance = (distanceKm, applyNightSurcharge = isNightTime()) => {
  if (!distanceKm || distanceKm <= 0) return 0;
  
  let baseFare = AUTO_FARE_CONFIG.minimumFare;
  if (distanceKm > 1.5) {
    baseFare += (distanceKm - 1.5) * AUTO_FARE_CONFIG.ratePerKm;
  }
  
  if (applyNightSurcharge) {
    baseFare += baseFare * AUTO_FARE_CONFIG.nightSurcharge;
  }
  
  return Math.round(baseFare); // Rounded to nearest rupee as per tariff
};
