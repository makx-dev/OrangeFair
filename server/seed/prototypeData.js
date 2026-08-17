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
];

const seedData = async () => {
  console.log('Clearing existing prototype data...');
  await User.deleteMany({ email: { $regex: '@prototype.local$' } });
  
  // Clean start for demo
  await User.deleteMany({});
  await Plate.deleteMany({});
  await Ride.deleteMany({});
  await Report.deleteMany({});
  await Comment.deleteMany({});

  console.log('Generating users...');
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const riders = [];
  for (let i = 1; i <= 20; i++) {
    riders.push({
      name: `Rider ${i}`,
      email: `rider${i}@prototype.local`,
      passwordHash: defaultPasswordHash,
      role: 'rider',
    });
  }
  const createdRiders = await User.insertMany(riders);

  const drivers = [
    { name: 'Driver A', email: 'driverA@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver B', email: 'driverB@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver C', email: 'driverC@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver D', email: 'driverD@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver E', email: 'driverE@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver F', email: 'driverF@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver G', email: 'driverG@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver H', email: 'driverH@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver I', email: 'driverI@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
    { name: 'Driver J', email: 'driverJ@prototype.local', passwordHash: defaultPasswordHash, role: 'driver' },
  ];
  const createdDrivers = await User.insertMany(drivers);

  console.log('Generating plates...');
  const plateConfigs = [
    { number: 'MH31AB1234', driverIndex: 0, profile: 'trusted' },
    { number: 'MH31XY9876', driverIndex: 1, profile: 'problem' },
    { number: 'MH31CD8451', driverIndex: 2, profile: 'trusted' },
    { number: 'MH31EF2208', driverIndex: 3, profile: 'trusted' },
    { number: 'MH31ZZ5555', driverIndex: 4, profile: 'improving' },
    { number: 'MH31AA1111', driverIndex: 5, profile: 'trusted' },
    { number: 'MH31BB2222', driverIndex: 6, profile: 'trusted' },
    { number: 'MH31CC3333', driverIndex: 7, profile: 'watch' },
    { number: 'MH31DD4444', driverIndex: 8, profile: 'watch' },
    { number: 'MH31EE5555', driverIndex: 9, profile: 'trusted' },
  ];

  const plates = plateConfigs.map(c => ({
    plateNumber: c.number,
    driverId: createdDrivers[c.driverIndex]._id,
    verificationStatus: true,
    verificationSource: 'RTO Nagpur',
    lastVerifiedAt: new Date(),
    verifiedVehicleData: { model: 'Bajaj RE', year: '2021' },
    trustScore: 50,
    trustTier: 'Watch',
  }));

  const createdPlates = await Plate.insertMany(plates);

  console.log('Generating rides, reports, and comments...');
  
  for (const config of plateConfigs) {
    const plateRecord = createdPlates.find(p => p.plateNumber === config.number);
    let rideCount = 0;
    let overchargeRate = 0;
    let reportRate = 0;

    if (config.profile === 'trusted') {
      rideCount = Math.floor(Math.random() * 20) + 30; // 30-50
      overchargeRate = 0.05;
      reportRate = 0.02;
    } else if (config.profile === 'problem') {
      rideCount = Math.floor(Math.random() * 10) + 15; // 15-25
      overchargeRate = 0.8;
      reportRate = 0.4;
    } else if (config.profile === 'watch') {
      rideCount = Math.floor(Math.random() * 15) + 15; // 15-30
      overchargeRate = 0.3;
      reportRate = 0.15;
    } else if (config.profile === 'improving') {
      rideCount = 40;
      overchargeRate = 0.1;
      reportRate = 0.05;
    }

    const plateRides = [];
    const plateReports = [];
    const plateComments = [];

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < rideCount; i++) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      const rider = createdRiders[Math.floor(Math.random() * createdRiders.length)];
      const isOvercharged = Math.random() < overchargeRate;
      
      let fareAmount = route.fairFare;
      if (isOvercharged) {
        fareAmount = route.fairFare + Math.floor(Math.random() * 30) + 20; // Overcharge by 20-50
      } else {
        fareAmount += Math.floor(Math.random() * 10) - 5; // slight variance
      }

      if (config.profile === 'improving') {
        const timeOffset = thirtyDaysAgo + (i / rideCount) * (now - thirtyDaysAgo);
        const isOld = (now - timeOffset) > 15 * 24 * 60 * 60 * 1000;
        if (isOld) {
           fareAmount = route.fairFare + 40; 
        } else {
           fareAmount = route.fairFare;
        }
      }

      const timestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));

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

      let isReported = false;
      if (fareAmount > route.fairFare + 15 && Math.random() < reportRate * 5) {
        isReported = true;
      }

      if (isReported) {
        const report = await Report.create({
          riderId: rider._id,
          plateNumber: config.number,
          rideId: ride._id,
          reason: 'Overcharged',
          description: `Asked for ₹${fareAmount} on a ₹${route.fairFare} route.`,
          createdAt: timestamp
        });
        plateReports.push(report);
      }

      if (Math.random() < 0.3) {
        const tag = (fareAmount <= route.fairFare + 10) ? 'Fair fare' : 'Overcharged';
        const comment = await Comment.create({
          riderId: rider._id,
          plateNumber: config.number,
          linkedRideId: ride._id,
          tag: tag === 'Fair fare' ? 'Used Meter' : 'Overcharged',
          text: tag === 'Fair fare' ? 'Good driver, fair price.' : `Demanded ₹${fareAmount} instead of meter.`,
          createdAt: timestamp
        });

        if (tag === 'Overcharged' && Math.random() < 0.5) {
          comment.driverReply = "The ride was shared and fare agreed before departure.";
          await comment.save();
        }
        plateComments.push(comment);
      }
    }

    const overchargeReports = plateReports.filter(r => r.reason === 'Overcharged');
    if (overchargeReports.length > 0) {
      await Report.refreshPlateReportStatuses({ plateNumber: config.number, reason: 'Overcharged' });
    }

    const updatedReports = await Report.find({ plateNumber: config.number }).lean();
    const trustResult = calculatePlateTrust({ rides: plateRides, reports: updatedReports });
    
    plateRecord.trustScore = trustResult.trustScore;
    plateRecord.trustTier = trustResult.trustTier;
    plateRecord.explanation = trustResult.explanation;
    await plateRecord.save();
  }

  console.log('Seed data generated successfully!');
};

module.exports = { seedData };
