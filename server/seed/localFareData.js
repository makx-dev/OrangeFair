const FareObservation = require('../models/FareObservation');
const { getRouteKey } = require('../utils/fareIntelligence');

// Example Seed Routes for Nagpur
const seedRoutes = [
  {
    pickup: { name: 'Sitabuldi', lat: 21.144, lng: 79.083 },
    drop: { name: 'Railway Station', lat: 21.149, lng: 79.097 },
    distanceKm: 2.1,
    distributions: {
      shared: { min: 20, max: 35, count: 143, median: 27 },
      private: { min: 60, max: 90, count: 52, median: 75 }
    }
  },
  {
    pickup: { name: 'Dharampeth', lat: 21.139, lng: 79.053 },
    drop: { name: 'Airport', lat: 21.059, lng: 79.055 },
    distanceKm: 9.8,
    distributions: {
      private: { min: 220, max: 280, count: 87, median: 250 },
      shared: { min: 40, max: 60, count: 12, median: 50 } // Low confidence
    }
  },
  {
    pickup: { name: 'Sadar', lat: 21.157, lng: 79.075 },
    drop: { name: 'Itwari', lat: 21.152, lng: 79.111 },
    distanceKm: 5.2,
    distributions: {
      shared: { min: 30, max: 45, count: 189, median: 35 },
      private: { min: 100, max: 140, count: 64, median: 120 }
    }
  }
];

/**
 * Generates an array of dummy observations based on distribution parameters.
 */
const generateDummyObservations = (route, rideType, distParams) => {
  const observations = [];
  const routeKey = getRouteKey(route.pickup.lat, route.pickup.lng, route.drop.lat, route.drop.lng);

  for (let i = 0; i < distParams.count; i++) {
    // Generate a bell-curve-like random around median
    // Using simple approach: average of 3 randoms + offset
    const rand = (Math.random() + Math.random() + Math.random()) / 3;
    let fare = distParams.min + rand * (distParams.max - distParams.min);
    
    // occasionally throw in an outlier
    if (Math.random() < 0.05) {
      fare = distParams.max + Math.random() * 50; 
    }

    observations.push({
      pickupLocation: route.pickup,
      dropLocation: route.drop,
      routeKey: routeKey,
      rideType: rideType,
      farePaid: Math.round(fare),
      distanceKm: route.distanceKm,
      source: 'seed',
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
    });
  }
  return observations;
};

const seedLocalFareData = async () => {
  try {
    const existingCount = await FareObservation.countDocuments({ source: 'seed' });
    if (existingCount > 0) {
      console.log('Local fare seed data already exists. Skipping seed.');
      return;
    }

    console.log('Seeding Local Fare data for prototype...');
    const allObservations = [];

    for (const route of seedRoutes) {
      if (route.distributions.shared) {
        allObservations.push(...generateDummyObservations(route, 'shared', route.distributions.shared));
      }
      if (route.distributions.private) {
        allObservations.push(...generateDummyObservations(route, 'private', route.distributions.private));
      }
    }

    await FareObservation.insertMany(allObservations);
    console.log(`Successfully seeded ${allObservations.length} fare observations.`);
  } catch (error) {
    console.error('Error seeding local fare data:', error);
  }
};

module.exports = { seedLocalFareData };
