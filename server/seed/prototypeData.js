const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Plate = require('../models/Plate');
const Ride = require('../models/Ride');
const Report = require('../models/Report');
const Comment = require('../models/Comment');
const { calculatePlateTrust } = require('../utils/plateTrust');

const routes = [
  { pickup: 'Sitabuldi', drop: 'Railway Station', distance: 2.5, fairFare: 30 },
  { pickup: 'Airport', drop: 'Dharampeth', distance: 8.0, fairFare: 160 },
  { pickup: 'Medical Square', drop: 'Sadar', distance: 6.0, fairFare: 90 },
  { pickup: 'Manewada', drop: 'Hingna', distance: 10.0, fairFare: 140 },
  { pickup: 'Wardha Road', drop: 'Central Avenue', distance: 5.0, fairFare: 70 },
  { pickup: 'Sitaburdi Metro Station', drop: 'VR Mall Nagpur', distance: 2.0, fairFare: 10 },
  { pickup: 'Hingna T Point (Vasudev Nagar)', drop: 'Burdi', distance: 7.0, fairFare: 30 },
  { pickup: 'Subash Nagar', drop: 'Ganesh Peth Bus Stop', distance: 6.5, fairFare: 30 },
  { pickup: 'Sitaburdi', drop: 'Ganesh Peth Bus Stop', distance: 3.5, fairFare: 20 },
  { pickup: 'Hingna T Point', drop: 'Lokmanya Nagar', distance: 2.0, fairFare: 10 },
  { pickup: 'Lokmanya Nagar', drop: 'Isasani', distance: 1.5, fairFare: 10 },
];

const seedData = async () => {
  console.log('Clearing existing prototype data...');
  
  // Clean start for demo
  await User.deleteMany({});
  await Plate.deleteMany({});
  await Ride.deleteMany({});
  await Report.deleteMany({});
  await Comment.deleteMany({});

  console.log('Generating demo user...');
  const demoPasswordHash = await bcrypt.hash('Demo@123', 10);
  
  const demoUser = await User.create({
    name: 'Demo User',
    email: 'demo@orangefair.local',
    passwordHash: demoPasswordHash,
    role: 'rider',
  });

  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const riders = [demoUser];
  for (let i = 1; i <= 20; i++) {
    riders.push(await User.create({
      name: `Rider ${i}`,
      email: `rider${i}@prototype.local`,
      passwordHash: defaultPasswordHash,
      role: 'rider',
    }));
  }

  const drivers = [];
  for (let i = 1; i <= 10; i++) {
    drivers.push(await User.create({
      name: `Driver ${i}`,
      email: `driver${i}@prototype.local`,
      passwordHash: defaultPasswordHash,
      role: 'driver'
    }));
  }

  console.log('Generating plates...');
  const plateConfigs = [
    { number: 'MH31AB1024', driverIndex: 0, profile: 'trusted_exact' }, // 42 rides, 94% near expected, 0 confirmed
    { number: 'MH31CD8451', driverIndex: 1, profile: 'watch_exact' },   // 27 rides, 79% near expected, 2 under review
    { number: 'MH31EF2208', driverIndex: 2, profile: 'trusted' },
    { number: 'MH31GH3142', driverIndex: 3, profile: 'trusted' },
    { number: 'MH31JK7781', driverIndex: 4, profile: 'flagged_exact' }, // 23 rides, multiple corroborated reports
    { number: 'MH31LM4019', driverIndex: 5, profile: 'improving_exact' }, // previously flagged, clean recent rides
    { number: 'MH31NP5620', driverIndex: 6, profile: 'watch' },
    { number: 'MH31QR9031', driverIndex: 7, profile: 'trusted' },
    { number: 'MH31ST1874', driverIndex: 8, profile: 'watch' },
    { number: 'MH31UV6452', driverIndex: 9, profile: 'trusted' },
  ];

  const createdPlates = [];
  for (const c of plateConfigs) {
    createdPlates.push(await Plate.create({
      plateNumber: c.number,
      driverId: drivers[c.driverIndex]._id,
      verificationStatus: true,
      verificationSource: 'RTO Nagpur',
      lastVerifiedAt: new Date(),
      verifiedVehicleData: { model: 'Bajaj RE', year: '2021' },
      trustScore: 50,
      trustTier: 'Watch',
    }));
  }

  console.log('Generating rides, reports, and comments...');
  
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  for (let cIdx = 0; cIdx < plateConfigs.length; cIdx++) {
    const config = plateConfigs[cIdx];
    const plateRecord = createdPlates[cIdx];
    
    let rideCount = 0;
    let overchargeRate = 0;
    let reportRate = 0;

    if (config.profile === 'trusted_exact') {
      rideCount = 42;
      overchargeRate = 0.05; // Make sure ~94% near expected
    } else if (config.profile === 'watch_exact') {
      rideCount = 27;
      overchargeRate = 0.20; // ~79% near expected
    } else if (config.profile === 'flagged_exact') {
      rideCount = 23;
      overchargeRate = 0.8;
      reportRate = 1.0;
    } else if (config.profile === 'improving_exact') {
      rideCount = 35;
      overchargeRate = 0.0;
    } else if (config.profile === 'trusted') {
      rideCount = Math.floor(Math.random() * 15) + 30;
      overchargeRate = 0.05;
    } else if (config.profile === 'watch') {
      rideCount = Math.floor(Math.random() * 10) + 20;
      overchargeRate = 0.25;
    }

    const plateRides = [];
    const plateReports = [];

    for (let i = 0; i < rideCount; i++) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      // Force demoUser to have some history
      const rider = (Math.random() < 0.2) ? demoUser : riders[Math.floor(Math.random() * riders.length)];
      
      let isOvercharged = false;
      let timeOffset = thirtyDaysAgo + (i / rideCount) * (now - thirtyDaysAgo);
      
      if (config.profile === 'trusted_exact') {
        isOvercharged = i >= 40; // Only 2 out of 42 overcharged (~95% accuracy)
      } else if (config.profile === 'watch_exact') {
        isOvercharged = i >= 21; // 6 out of 27 overcharged (~78% accuracy)
      } else if (config.profile === 'flagged_exact') {
        isOvercharged = true;
      } else if (config.profile === 'improving_exact') {
        const isOld = (now - timeOffset) > 15 * 24 * 60 * 60 * 1000;
        isOvercharged = isOld;
      } else {
        isOvercharged = Math.random() < overchargeRate;
      }

      let fareAmount = route.fairFare;
      if (isOvercharged) {
        fareAmount = route.fairFare + Math.floor(Math.random() * 20) + 15;
      } else {
        fareAmount += Math.floor(Math.random() * 4) - 2;
      }

      const timestamp = new Date(timeOffset);

      const ride = await Ride.create({
        riderId: rider._id,
        plateNumber: config.number,
        route: { pickup: route.pickup, drop: route.drop },
        fareAmount,
        passengerCount: Math.floor(Math.random() * 3) + 1,
        dropPoints: [{ label: route.drop, distanceFromPickup: route.distance }],
        timestamp
      });
      plateRides.push(ride);

      // Generating reports
      let generateReport = false;
      if (config.profile === 'flagged_exact') {
        generateReport = Math.random() < 0.6; // multiple corroborated reports
      } else if (config.profile === 'watch_exact') {
        generateReport = i === 22 || i === 23; // exactly 2 reports
      } else if (config.profile === 'improving_exact' && isOvercharged) {
        generateReport = Math.random() < 0.8; // corroborated issues in the past
      } else if (isOvercharged && Math.random() < reportRate) {
        generateReport = true;
      }

      if (generateReport) {
        const report = await Report.create({
          riderId: rider._id,
          plateNumber: config.number,
          rideId: ride._id,
          reason: 'Overcharged',
          description: `Asked for ₹${fareAmount} on a ₹${route.fairFare} route.`,
          status: 'Submitted',
          createdAt: timestamp
        });
        plateReports.push(report);
      }

      // Generating comments
      if (Math.random() < 0.3) {
        const tag = (!isOvercharged) ? 'Used Meter' : 'Overcharged';
        const text = (!isOvercharged) ? 'Smooth ride and no issues.' : `Driver asked more than the usual local amount.`;
        
        const comment = await Comment.create({
          riderId: rider._id,
          plateNumber: config.number,
          linkedRideId: ride._id,
          tag: tag,
          text: text,
          createdAt: timestamp
        });

        // Driver right-of-reply
        if (tag === 'Overcharged' && Math.random() < 0.4) {
          comment.driverReply = "Fare was agreed before departure.";
          await comment.save();
        }
      }
    }

    // Refresh plate report statuses
    const overchargeReports = plateReports.filter(r => r.reason === 'Overcharged');
    if (overchargeReports.length > 0) {
      await Report.refreshPlateReportStatuses({ plateNumber: config.number, reason: 'Overcharged' });
    }
    
    // For watch_exact, ensure reports stay Under Review (not Pattern Confirmed)
    if (config.profile === 'watch_exact') {
      await Report.updateMany({ plateNumber: config.number }, { $set: { status: 'UnderReview' } });
    }

    const updatedReports = await Report.find({ plateNumber: config.number }).lean();
    const trustResult = calculatePlateTrust({ rides: plateRides, reports: updatedReports });
    
    plateRecord.trustScore = trustResult.trustScore;
    plateRecord.trustTier = trustResult.trustTier;
    
    // Force specific tiers just to be safe if calculation logic varies slightly
    if (config.profile === 'improving_exact') plateRecord.trustTier = 'Watch';
    
    plateRecord.explanation = trustResult.explanation;
    await plateRecord.save();
  }

  // Add some specific route comments 
  const routeComments = [
    {
      riderId: demoUser._id,
      plateNumber: 'MH31AB1024',
      routeKey: 'Sitaburdi|Ganesh Peth Bus Stop',
      tag: 'Fair Fare',
      text: 'Usually around ₹20 for this route.',
      createdAt: new Date(),
    }
  ];

  for (const rc of routeComments) {
    await Comment.create(rc);
  }

  console.log('Seed data generated successfully!');
};

module.exports = { seedData };
