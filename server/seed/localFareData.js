const mongoose = require('mongoose');
const FareObservation = require('../models/FareObservation');
const Comment = require('../models/Comment');
const { getRouteKey } = require('../utils/fareIntelligence');

const prototypeLocations = {
  sitaburdiMetro: { name: 'Sitaburdi Metro Station', lat: 21.1460206, lng: 79.0897328 },
  vrMall: { name: 'VR Mall Nagpur', lat: 21.1377319, lng: 79.068821 },
  hingnaTPointVasudev: { name: 'Hingna T Point (Vasudev Nagar)', lat: 21.1187853, lng: 79.0194659 },
  burdi: { name: 'Burdi', lat: 21.1402262, lng: 79.0871588 },
  subashNagar: { name: 'Subash Nagar', lat: 21.128, lng: 79.043 },
  ganeshPeth: { name: 'Ganesh Peth Bus Stop', lat: 21.144, lng: 79.102 },
  sitaburdi: { name: 'Sitaburdi', lat: 21.1402262, lng: 79.0871588 },
  hingnaTPoint: { name: 'Hingna T Point', lat: 21.1229783, lng: 79.0380712 },
  lokmanyaNagar: { name: 'Lokmanya Nagar', lat: 21.1108046, lng: 79.001754 },
  isasani: { name: 'Isasani', lat: 21.101, lng: 78.983 }
};

const prototypeRoutes = [
  {
    pickup: prototypeLocations.sitaburdiMetro,
    drop: prototypeLocations.vrMall,
    fare: 10,
    rideType: 'shared',
    comments: [
      { tag: 'Fair Fare', text: 'Fare matched the usual local amount.', type: 'positive' }
    ]
  },
  {
    pickup: prototypeLocations.hingnaTPointVasudev,
    drop: prototypeLocations.burdi,
    fare: 30,
    rideType: 'shared',
    comments: [
      { tag: 'Fair Fare', text: 'Driver quoted ₹30 and dropped at Burdi.', type: 'positive' }
    ]
  },
  {
    pickup: prototypeLocations.subashNagar,
    drop: prototypeLocations.ganeshPeth,
    fare: 30,
    rideType: 'shared',
    comments: [
      { tag: 'Used Meter', text: 'Meter was used for the ride.', type: 'positive' }
    ]
  },
  {
    pickup: prototypeLocations.sitaburdi,
    drop: prototypeLocations.ganeshPeth,
    fare: 20,
    rideType: 'shared',
    comments: [
      { tag: 'Fair Fare', text: '₹20 felt reasonable for this route.', type: 'positive' },
      { tag: 'Overcharged', text: 'Driver asked for more than the usual local fare.', type: 'negative' }
    ]
  },
  {
    pickup: prototypeLocations.hingnaTPoint,
    drop: prototypeLocations.lokmanyaNagar,
    fare: 10,
    rideType: 'shared',
    comments: [
      { tag: 'Fair Fare', text: 'Short shared ride, fare was reasonable.', type: 'positive' }
    ]
  },
  {
    pickup: prototypeLocations.lokmanyaNagar,
    drop: prototypeLocations.isasani,
    fare: 10,
    rideType: 'shared',
    comments: [
      { tag: 'Fair Fare', text: 'Fare was around the usual local amount.', type: 'positive' },
      { tag: 'Refused Meter', text: 'Driver preferred a negotiated fare instead of using the meter.', type: 'negative' }
    ]
  }
];

const generateDummyObservations = (routeData) => {
  const observations = [];
  const routeKey = getRouteKey(routeData.pickup.lat, routeData.pickup.lng, routeData.drop.lat, routeData.drop.lng);

  observations.push({
    pickupLocation: routeData.pickup,
    dropLocation: routeData.drop,
    routeKey: routeKey,
    rideType: routeData.rideType,
    farePaid: routeData.fare,
    distanceKm: 2, 
    source: 'seed',
    isPrototypeData: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) 
  });

  const numVariations = 10 + Math.floor(Math.random() * 5); // Add ~10-14 supporting observations
  
  for (let i = 0; i < numVariations; i++) {
    // Determine variation (e.g., 0, 0, 0, +5, -5) to make it look realistic
    let variance = 0;
    const r = Math.random();
    if (r > 0.8) variance = 5;
    else if (r > 0.7) variance = -5;
    else if (r > 0.6) variance = 2;
    
    // Make sure fare doesn't drop below 0
    let finalFare = routeData.fare + variance;
    if (finalFare <= 0) finalFare = routeData.fare;

    observations.push({
      pickupLocation: routeData.pickup,
      dropLocation: routeData.drop,
      routeKey: routeKey,
      rideType: routeData.rideType,
      farePaid: finalFare,
      distanceKm: 2,
      source: 'seed',
      isPrototypeData: true,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }

  return observations;
};

const seedLocalFareData = async () => {
  try {
    await FareObservation.deleteMany({ source: 'seed' });
    await Comment.deleteMany({ source: 'seed' });

    console.log('Seeding Local Fare Prototype data...');
    const allObservations = [];
    const allComments = [];

    let dummyUser = await mongoose.model('User').findOne({ email: 'demo@orangefair.local' });
    if (!dummyUser) {
        dummyUser = await mongoose.model('User').findOne({ role: 'rider' });
    }

    for (const route of prototypeRoutes) {
      const routeObs = generateDummyObservations(route);
      allObservations.push(...routeObs);

      const routeKey = getRouteKey(route.pickup.lat, route.pickup.lng, route.drop.lat, route.drop.lng);

      if (route.comments && route.comments.length > 0) {
        for (const c of route.comments) {
          allComments.push({
            riderId: dummyUser._id,
            plateNumber: 'MH31AB1024',
            routeKey: routeKey,
            tag: c.tag,
            text: c.text,
            source: 'seed',
            isPrototypeData: true,
            createdAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
          });
        }
      }
    }

    await FareObservation.insertMany(allObservations);
    await Comment.insertMany(allComments);
    console.log(`Successfully seeded ${allObservations.length} prototype fare observations and ${allComments.length} prototype comments.`);
  } catch (error) {
    console.error('Error seeding local fare prototype data:', error);
  }
};

module.exports = { seedLocalFareData };
