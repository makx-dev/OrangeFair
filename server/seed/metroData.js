// Configuration for Metro calculation logic
const METRO_FARE_CONFIG = {
  BASE_FARE: 10,       // Minimum metro fare
  PER_KM_RATE: 2.5,    // Additional fare per km
  MAX_FARE: 40,        // Cap on metro fare
  MAX_WALKING_DISTANCE_KM: 1.5,
  WALK_SPEED_KMPH: 4.5,
  METRO_SPEED_KMPH: 35,
  AUTO_SPEED_KMPH: 20,
  AUTO_SHORT_TRIP_FARE: 15, // E.g., shared auto to metro station
};

// Simplified demo dataset for Nagpur Metro
// We are adding stations relevant to the demo routes.
const stations = [
  { name: 'Sitabuldi Interchange', latitude: 21.1415, longitude: 79.0805, line: 'Both' },
  { name: 'Lokmanya Nagar', latitude: 21.1090, longitude: 78.9950, line: 'Aqua' },
  { name: 'Vasudev Nagar', latitude: 21.1116, longitude: 79.0118, line: 'Aqua' }, // Near Hingna T Point
  { name: 'Subhash Nagar', latitude: 21.1309, longitude: 79.0345, line: 'Aqua' },
  { name: 'Institute of Engineers', latitude: 21.1354, longitude: 79.0520, line: 'Aqua' },
  { name: 'Jhansi Rani Square', latitude: 21.1402, longitude: 79.0760, line: 'Aqua' },
  { name: 'Cotton Market', latitude: 21.1469, longitude: 79.0927, line: 'Orange' }, // Near Ganesh Peth
  { name: 'Nagpur Railway Station', latitude: 21.1517, longitude: 79.0887, line: 'Orange' },
  { name: 'Dosar Vaisya Square', latitude: 21.1550, longitude: 79.0930, line: 'Orange' },
  { name: 'Congress Nagar', latitude: 21.1329, longitude: 79.0847, line: 'Orange' },
  { name: 'Rahate Colony', latitude: 21.1270, longitude: 79.0850, line: 'Orange' },
  { name: 'Medical Square', latitude: 21.1278, longitude: 79.0933, line: 'Orange' }, // Near VR Mall
  { name: 'Airport', latitude: 21.0855, longitude: 79.0550, line: 'Orange' }
];

module.exports = {
  stations,
  METRO_FARE_CONFIG
};
