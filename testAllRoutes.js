const { getSmartRecommendation } = require('./server/utils/metroIntelligence');
const { searchLocations } = require('./client/src/utils/geoApi'); // Unfortunately geoApi is frontend code relying on fetch, might not work easily in node unless node fetch is available.

// Let's just mock the coordinates for the demo routes based on the names.

const routes = [
  { name: 'Route 1', pickupLat: 21.1415, pickupLng: 79.0805, dropLat: 21.1278, dropLng: 79.0933, fare: 30, dist: 3.5 }, // Sitaburdi -> VR Mall
  { name: 'Route 2', pickupLat: 21.1116, pickupLng: 79.0118, dropLat: 21.1415, dropLng: 79.0805, fare: 60, dist: 8.0 }, // Hingna T Point -> Burdi
  { name: 'Route 3', pickupLat: 21.1309, pickupLng: 79.0345, dropLat: 21.1469, dropLng: 79.0927, fare: 50, dist: 6.5 }, // Subash Nagar -> Ganesh Peth
  { name: 'Route 4', pickupLat: 21.1415, pickupLng: 79.0805, dropLat: 21.1469, dropLng: 79.0927, fare: 25, dist: 2.0 }, // Sitaburdi -> Ganesh Peth
  { name: 'Route 5', pickupLat: 21.1116, pickupLng: 79.0118, dropLat: 21.1090, dropLng: 78.9950, fare: 20, dist: 2.0 }, // Hingna T Point -> Lokmanya Nagar
  { name: 'Route 6', pickupLat: 21.1090, pickupLng: 78.9950, dropLat: 21.0900, dropLng: 78.9800, fare: 20, dist: 3.0 }, // Lokmanya Nagar -> Isasani (no metro near Isasani)
];

for (const r of routes) {
  const result = getSmartRecommendation(r.pickupLat, r.pickupLng, r.dropLat, r.dropLng, r.fare, r.dist);
  console.log(`${r.name}: ${result.isPractical ? 'YES' : 'NO'} - ${result.reason || (result.isCheaper ? 'Cheaper' : 'Not cheaper but maybe faster')}`);
}
