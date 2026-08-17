// utils/fareIntelligence.js

/**
 * Normalizes a coordinate to a 3-decimal place string (~110m precision).
 * This groups nearby locations into a single route cluster.
 */
const normalizeCoordinate = (coord) => {
  return Number(coord).toFixed(3);
};

/**
 * Generates a route key from pickup and drop coordinates.
 */
const getRouteKey = (pickupLat, pickupLng, dropLat, dropLng) => {
  return `${normalizeCoordinate(pickupLat)}_${normalizeCoordinate(pickupLng)}__${normalizeCoordinate(dropLat)}_${normalizeCoordinate(dropLng)}`;
};

/**
 * Calculates fare statistics from an array of observations.
 * Uses Median and IQR (Interquartile Range) to filter outliers.
 */
const calculateFareStatistics = (observations) => {
  if (!observations || observations.length === 0) {
    return null;
  }

  // Extract fares and sort ascending
  const fares = observations.map(obs => obs.farePaid).sort((a, b) => a - b);
  
  if (fares.length === 1) {
    return {
      median: fares[0],
      lowerRange: fares[0],
      upperRange: fares[0],
      sampleSize: 1
    };
  }

  // Calculate Quartiles
  const q1 = fares[Math.floor(fares.length * 0.25)];
  const median = fares[Math.floor(fares.length * 0.5)];
  const q3 = fares[Math.floor(fares.length * 0.75)];
  
  // IQR Outlier filtering (1.5 * IQR)
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Filter fares within the bounds
  const validFares = fares.filter(f => f >= lowerBound && f <= upperBound);
  
  // If all were outliers somehow, fallback to original
  const finalFares = validFares.length > 0 ? validFares : fares;
  
  const finalMedian = finalFares[Math.floor(finalFares.length * 0.5)];
  
  // For the display range, we can use 10th and 90th percentile of valid fares
  // or just min/max of valid fares if sample size is small
  const lowerRange = finalFares[Math.floor(finalFares.length * 0.1)] || finalFares[0];
  const upperRange = finalFares[Math.floor(finalFares.length * 0.9)] || finalFares[finalFares.length - 1];

  return {
    median: finalMedian,
    lowerRange,
    upperRange,
    sampleSize: observations.length // return total sample size even if outliers existed
  };
};

/**
 * Determines confidence level based on sample size.
 */
const calculateConfidence = (sampleSize) => {
  if (sampleSize >= 50) return 'High confidence';
  if (sampleSize >= 10) return 'Medium confidence';
  if (sampleSize > 0) return 'Low confidence';
  return 'No data';
};

module.exports = {
  getRouteKey,
  calculateFareStatistics,
  calculateConfidence,
  normalizeCoordinate
};
