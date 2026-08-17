const { getSmartRecommendation } = require('./server/utils/metroIntelligence');

// Example: Sitabuldi to VR Mall (Medical Square)
const r1 = getSmartRecommendation(21.1415, 79.0805, 21.1278, 79.0933, 40, 3.5);
console.log("Route 1:", r1);

// Example: No metro route (far away)
const r2 = getSmartRecommendation(21.1415, 79.0805, 21.9278, 79.9933, 200, 100);
console.log("Route 2:", r2);
