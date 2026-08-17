const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Plate = require('../models/Plate');
const Ride = require('../models/Ride');
const Report = require('../models/Report');
const Comment = require('../models/Comment');
const RTOEscalation = require('../models/RTOEscalation');
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

const POSITIVE_COMMENTS = [
  { tag: 'Used Meter', text: 'Driver used meter without negotiating.' },
  { tag: 'Fair Fare', text: 'Fare matched the usual route amount.' },
  { tag: 'Safe Driving', text: 'Smooth ride and polite driver.' },
  { tag: 'Clean Auto', text: 'Auto was clean and ride was comfortable.' },
  { tag: 'Helpful Driver', text: 'Driver explained the fare before departure.' },
  { tag: 'Polite', text: 'Very polite behavior and helped with luggage.' },
  { tag: 'Fair Fare', text: 'Exact meter fare charged, no fuss at all.' },
  { tag: 'Used Meter', text: 'Turned on meter immediately at pickup point.' },
  { tag: 'Safe Driving', text: 'Careful driving through Sitabuldi traffic.' },
  { tag: 'Clean Auto', text: 'Well maintained auto rickshaw and sanitised seat.' },
];

const NEGATIVE_COMMENTS = [
  { tag: 'Overcharged', text: 'Asked for ₹40 when the route is usually ₹25–30.' },
  { tag: 'Refused Meter', text: 'Driver refused a short trip and declined meter.' },
  { tag: 'Overcharged', text: 'Meter was not used; fare was negotiated high.' },
  { tag: 'Rude', text: 'Driver was argumentative when asked for meter.' },
  { tag: 'Unclear Fare', text: 'Demanded extra ₹30 at destination citing traffic.' },
  { tag: 'Refused Short Trip', text: 'Refused to go towards Station during evening peak.' },
  { tag: 'Unsafe Driving', text: 'Overtaking abruptly in heavy traffic on Wardha Rd.' },
  { tag: 'Refused Meter', text: 'Quoted fixed 100 Rs instead of using meter.' },
];

const MIXED_COMMENTS = [
  { tag: 'Fair Fare', text: 'Agreed on reasonable fare after quick discussion.' },
  { tag: 'Polite', text: 'Friendly driver though route had a small detour.' },
  { tag: 'Used Meter', text: 'Used meter but asked for round figure change.' },
];

const seedData = async () => {
  console.log('Clearing existing prototype data...');

  // Clean start for demo
  await User.deleteMany({});
  await Plate.deleteMany({});
  await Ride.deleteMany({});
  await Report.deleteMany({});
  await Comment.deleteMany({});
  await RTOEscalation.deleteMany({});

  console.log('Generating demo users...');
  const demoPasswordHash = await bcrypt.hash('Demo@123', 10);

  const demoUser = await User.create({
    name: 'Demo User',
    email: 'demo@orangefair.local',
    passwordHash: demoPasswordHash,
    role: 'rider',
    preferences: {
      language: 'en',
      notifications: {
        reportUpdates: true,
        communityActivity: true,
        accountNotifications: true,
      },
      profileVisibility: 'community',
      communityActivityVisibility: true,
    },
  });

  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const riders = [demoUser];
  for (let i = 1; i <= 20; i++) {
    riders.push(
      await User.create({
        name: `Rider ${i}`,
        email: `rider${i}@prototype.local`,
        passwordHash: defaultPasswordHash,
        role: 'rider',
        preferences: {
          language: i % 3 === 0 ? 'hi' : i % 3 === 1 ? 'mr' : 'en',
          notifications: { reportUpdates: true, communityActivity: true, accountNotifications: true },
          profileVisibility: 'community',
          communityActivityVisibility: true,
        },
      })
    );
  }

  const drivers = [];
  for (let i = 1; i <= 10; i++) {
    drivers.push(
      await User.create({
        name: `Driver ${i}`,
        email: `driver${i}@prototype.local`,
        passwordHash: defaultPasswordHash,
        role: 'driver',
      })
    );
  }

  console.log('Generating plates...');
  const plateConfigs = [
    { number: 'MH31AB1024', driverIndex: 0, profile: 'trusted_exact' }, // 42 rides, 95% near expected, 0 confirmed
    { number: 'MH31CD8451', driverIndex: 1, profile: 'watch_exact' }, // 27 rides, 78% near expected, 2 under review
    { number: 'MH31EF2208', driverIndex: 2, profile: 'trusted' },
    { number: 'MH31GH3142', driverIndex: 3, profile: 'trusted' },
    { number: 'MH31JK7781', driverIndex: 4, profile: 'flagged_exact' }, // multiple corroborated reports, PatternConfirmed
    { number: 'MH31LM4019', driverIndex: 5, profile: 'improving_exact' }, // previously flagged, clean recent rides
    { number: 'MH31NP5620', driverIndex: 6, profile: 'watch' },
    { number: 'MH31QR9031', driverIndex: 7, profile: 'trusted' },
    { number: 'MH31ST1874', driverIndex: 8, profile: 'watch' },
    { number: 'MH31UV6452', driverIndex: 9, profile: 'trusted' },
  ];

  const createdPlates = [];
  for (const c of plateConfigs) {
    createdPlates.push(
      await Plate.create({
        plateNumber: c.number,
        driverId: drivers[c.driverIndex]._id,
        verificationStatus: true,
        verificationSource: 'RTO Nagpur',
        lastVerifiedAt: new Date(),
        verifiedVehicleData: { model: 'Bajaj RE Auto', year: '2022', fuel: 'CNG' },
        trustScore: 50,
        trustTier: 'Watch',
      })
    );
  }

  console.log('Generating rides, reports, and rich comments...');

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const allReportsCreated = [];
  const demoReports = [];

  for (let cIdx = 0; cIdx < plateConfigs.length; cIdx++) {
    const config = plateConfigs[cIdx];
    const plateRecord = createdPlates[cIdx];

    let rideCount = 0;
    let overchargeRate = 0;

    if (config.profile === 'trusted_exact') {
      rideCount = 42;
      overchargeRate = 0.05;
    } else if (config.profile === 'watch_exact') {
      rideCount = 27;
      overchargeRate = 0.22;
    } else if (config.profile === 'flagged_exact') {
      rideCount = 23;
      overchargeRate = 0.82;
    } else if (config.profile === 'improving_exact') {
      rideCount = 35;
      overchargeRate = 0.0;
    } else if (config.profile === 'trusted') {
      rideCount = Math.floor(Math.random() * 10) + 30;
      overchargeRate = 0.05;
    } else if (config.profile === 'watch') {
      rideCount = Math.floor(Math.random() * 8) + 20;
      overchargeRate = 0.25;
    }

    const plateRides = [];
    const plateReports = [];

    for (let i = 0; i < rideCount; i++) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      // Ensure demoUser has history across vehicles
      const isDemoRider = (cIdx === 0 && i === 5) || (cIdx === 4 && i === 2) || (cIdx === 1 && i === 3) || Math.random() < 0.15;
      const rider = isDemoRider ? demoUser : riders[Math.floor(Math.random() * riders.length)];

      let isOvercharged = false;
      const timeOffset = thirtyDaysAgo + (i / rideCount) * (now - thirtyDaysAgo);

      if (config.profile === 'trusted_exact') {
        isOvercharged = i >= 40;
      } else if (config.profile === 'watch_exact') {
        isOvercharged = i >= 21;
      } else if (config.profile === 'flagged_exact') {
        isOvercharged = true;
      } else if (config.profile === 'improving_exact') {
        const isOld = now - timeOffset > 15 * 24 * 60 * 60 * 1000;
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
        timestamp,
      });
      plateRides.push(ride);

      // Generating reports
      let generateReport = false;
      let reportReason = 'Overcharged';
      let reportDesc = `Asked for ₹${fareAmount} when route is usually ₹${route.fairFare}.`;

      if (config.profile === 'flagged_exact') {
        generateReport = i < 6;
        if (i === 1) {
          reportReason = 'Refused Meter';
          reportDesc = 'Driver completely refused to use meter.';
        } else if (i === 2) {
          reportReason = 'Rude';
          reportDesc = 'Hostile response when reminded of official meter fare.';
        } else if (i === 3) {
          reportReason = 'Refused Short Trip';
          reportDesc = 'Refused to take passenger for short distance.';
        }
      } else if (config.profile === 'watch_exact') {
        generateReport = i >= 21 && i <= 24;
      } else if (config.profile === 'improving_exact' && isOvercharged) {
        generateReport = i < 4;
      } else if (config.number === 'MH31NP5620') {
        generateReport = i === 1 || i === 2 || i === 3;
        reportReason = i === 1 ? 'Refused Meter' : 'Refused Short Trip';
        reportDesc = i === 1 ? 'Refused to use meter on short transit.' : 'Declined passenger going to Medical Square.';
      } else if (config.number === 'MH31ST1874') {
        generateReport = i === 1 || i === 2 || i === 3;
        reportReason = 'Overcharged';
        reportDesc = 'Demanded ₹25 extra at drop point.';
      } else if (config.profile === 'trusted' || config.profile === 'trusted_exact') {
        generateReport = (cIdx === 0 && i === 41) || (cIdx === 2 && i === 5) || (cIdx === 3 && i === 7) || (cIdx === 7 && i === 12);
        reportReason = 'Overcharged';
        reportDesc = 'Minor disagreement on fare during peak hours.';
      }

      if (generateReport) {
        const isDemoReport = (config.profile === 'flagged_exact' && i === 0) ||
          (config.number === 'MH31NP5620' && i === 1) ||
          (config.number === 'MH31CD8451' && i === 22) ||
          (config.profile === 'trusted_exact' && i === 41);

        const reportRider = isDemoReport ? demoUser : rider;
        const report = await Report.create({
          riderId: reportRider._id,
          plateNumber: config.number,
          rideId: ride._id,
          reason: reportReason,
          description: reportDesc,
          status: 'Submitted',
          source: 'seed',
          isPrototypeData: true,
          createdAt: timestamp,
        });
        plateReports.push(report);
        allReportsCreated.push(report);
        if (reportRider._id.toString() === demoUser._id.toString()) {
          demoReports.push(report);
        }
      }
    }

    // Refresh plate report statuses
    const overchargeReports = plateReports.filter((r) => r.reason === 'Overcharged');
    if (overchargeReports.length > 0) {
      await Report.refreshPlateReportStatuses({ plateNumber: config.number, reason: 'Overcharged' });
    }

    // Ensure status consistency for specific demo profiles
    if (config.profile === 'flagged_exact') {
      await Report.updateMany({ plateNumber: config.number }, { $set: { status: 'PatternConfirmed' } });
    } else if (config.profile === 'watch_exact') {
      await Report.updateMany({ plateNumber: config.number }, { $set: { status: 'UnderReview' } });
    }

    const updatedReports = await Report.find({ plateNumber: config.number }).lean();
    const trustResult = calculatePlateTrust({ rides: plateRides, reports: updatedReports });

    plateRecord.trustScore = trustResult.trustScore;
    plateRecord.trustTier = trustResult.trustTier;
    if (config.profile === 'improving_exact') plateRecord.trustTier = 'Watch';
    plateRecord.explanation = trustResult.explanation;
    await plateRecord.save();
  }

  console.log('Generating 40-60 coherent, non-repetitive community comments...');
  
  // Specific crafted comments per vehicle to ensure realistic mix (55-65% positive, 20-30% negative, ~15% mixed)
  const commentTemplates = [
    // MH31AB1024 - Strongly Trusted (Demo 1)
    { plate: 'MH31AB1024', rider: demoUser, tag: 'Fair Fare', text: 'Fare matched the usual route amount. Driver is very honest.' },
    { plate: 'MH31AB1024', rider: riders[1], tag: 'Used Meter', text: 'Driver used meter without negotiating.' },
    { plate: 'MH31AB1024', rider: riders[2], tag: 'Safe Driving', text: 'Smooth ride and polite driver through busy traffic.' },
    { plate: 'MH31AB1024', rider: riders[3], tag: 'Clean Auto', text: 'Auto was clean and ride was comfortable.' },
    { plate: 'MH31AB1024', rider: riders[4], tag: 'Helpful Driver', text: 'Driver explained the fare before departure.' },
    { plate: 'MH31AB1024', rider: demoUser, tag: 'Polite', text: 'Great experience, helped with bags and charged standard fare.' },

    // MH31EF2208 - Trusted
    { plate: 'MH31EF2208', rider: riders[5], tag: 'Fair Fare', text: 'Fair fare charged for late night ride.' },
    { plate: 'MH31EF2208', rider: riders[6], tag: 'Used Meter', text: 'Meter was on right from railway station.' },
    { plate: 'MH31EF2208', rider: riders[7], tag: 'Safe Driving', text: 'Very disciplined driving on Wardha Road.' },
    { plate: 'MH31EF2208', rider: riders[8], tag: 'Clean Auto', text: 'Pleasant and clean vehicle interior.' },

    // MH31GH3142 - Trusted
    { plate: 'MH31GH3142', rider: riders[9], tag: 'Used Meter', text: 'Strictly adhered to meter rate.' },
    { plate: 'MH31GH3142', rider: riders[10], tag: 'Polite', text: 'Respectful driver and smooth transit.' },
    { plate: 'MH31GH3142', rider: riders[11], tag: 'Fair Fare', text: 'Charged exactly standard tariff.' },
    { plate: 'MH31GH3142', rider: riders[12], tag: 'Helpful Driver', text: 'Guided properly on nearest metro station.' },

    // MH31QR9031 - Trusted
    { plate: 'MH31QR9031', rider: riders[13], tag: 'Used Meter', text: 'Turned on meter immediately at airport.' },
    { plate: 'MH31QR9031', rider: riders[14], tag: 'Safe Driving', text: 'Safe driver, maintained moderate speed.' },
    { plate: 'MH31QR9031', rider: riders[15], tag: 'Clean Auto', text: 'Comfortable seating and tidy vehicle.' },
    { plate: 'MH31QR9031', rider: riders[16], tag: 'Fair Fare', text: 'Exact change returned without hassle.' },

    // MH31UV6452 - Trusted
    { plate: 'MH31UV6452', rider: riders[17], tag: 'Fair Fare', text: 'Reliable and fair pricing for morning commute.' },
    { plate: 'MH31UV6452', rider: riders[18], tag: 'Polite', text: 'Very courteous driver.' },
    { plate: 'MH31UV6452', rider: riders[19], tag: 'Used Meter', text: 'Used electronic meter with accurate distance.' },

    // MH31CD8451 - Watch (Mixed)
    { plate: 'MH31CD8451', rider: demoUser, tag: 'Overcharged', text: 'Asked for ₹40 when the route is usually ₹25–30.', reply: 'Fare was agreed due to detour.' },
    { plate: 'MH31CD8451', rider: riders[1], tag: 'Refused Meter', text: 'Refused to turn on meter near Sitabuldi.' },
    { plate: 'MH31CD8451', rider: riders[2], tag: 'Fair Fare', text: 'Charged standard rate on return trip.' },
    { plate: 'MH31CD8451', rider: riders[3], tag: 'Rude', text: 'Driver argued when asked for digital payment.' },
    { plate: 'MH31CD8451', rider: riders[4], tag: 'Safe Driving', text: 'Driving was safe despite initial bargaining.' },

    // MH31NP5620 - Watch
    { plate: 'MH31NP5620', rider: riders[5], tag: 'Refused Short Trip', text: 'Driver refused a short trip towards Medical Square.' },
    { plate: 'MH31NP5620', rider: riders[6], tag: 'Overcharged', text: 'Quoted 80 Rs instead of standard 50 Rs.' },
    { plate: 'MH31NP5620', rider: riders[7], tag: 'Used Meter', text: 'Agreed to meter after insistence.' },
    { plate: 'MH31NP5620', rider: demoUser, tag: 'Unclear Fare', text: 'Fare negotiated verbally before departure.' },

    // MH31ST1874 - Watch
    { plate: 'MH31ST1874', rider: riders[8], tag: 'Overcharged', text: 'Extra 20 Rs demanded near destination.' },
    { plate: 'MH31ST1874', rider: riders[9], tag: 'Refused Meter', text: 'Meter was broken according to driver.' },
    { plate: 'MH31ST1874', rider: riders[10], tag: 'Polite', text: 'Polite conversation but charged slightly high.' },
    { plate: 'MH31ST1874', rider: riders[11], tag: 'Fair Fare', text: 'Normal fare charged during daytime.' },

    // MH31JK7781 - Flagged (Problem Vehicle - Demo 2)
    { plate: 'MH31JK7781', rider: demoUser, tag: 'Overcharged', text: 'Asked for ₹60 on standard ₹30 route and declined meter.' },
    { plate: 'MH31JK7781', rider: riders[12], tag: 'Refused Meter', text: 'Completely refused meter at bus stop.' },
    { plate: 'MH31JK7781', rider: riders[13], tag: 'Rude', text: 'Driver was hostile when asked about tariff chart.' },
    { plate: 'MH31JK7781', rider: riders[14], tag: 'Unsafe Driving', text: 'Rushed driving and ignored traffic signal.' },
    { plate: 'MH31JK7781', rider: riders[15], tag: 'Unclear Fare', text: 'Overcharged twice the usual amount.' },
    { plate: 'MH31JK7781', rider: riders[16], tag: 'Refused Short Trip', text: 'Refused short trip passengers repeatedly.' },

    // MH31LM4019 - Improving Vehicle
    { plate: 'MH31LM4019', rider: riders[17], tag: 'Used Meter', text: 'Driver used meter properly on recent trip.' },
    { plate: 'MH31LM4019', rider: riders[18], tag: 'Safe Driving', text: 'Clean ride and safe transit on Ring Road.' },
    { plate: 'MH31LM4019', rider: riders[19], tag: 'Fair Fare', text: 'Adhered to exact meter reading.' },
    { plate: 'MH31LM4019', rider: riders[1], tag: 'Polite', text: 'Noticeably better service than earlier experiences.' },
  ];

  let commentCount = 0;
  for (const item of commentTemplates) {
    const timeOffset = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
    const matchingRide =
      (await Ride.findOne({ plateNumber: item.plate, riderId: item.rider._id })) ||
      (await Ride.findOne({ plateNumber: item.plate }));
    const matchingReport = await Report.findOne({ plateNumber: item.plate, riderId: item.rider._id });

    const comment = await Comment.create({
      riderId: item.rider._id,
      plateNumber: item.plate,
      linkedRideId: matchingRide ? matchingRide._id : undefined,
      linkedReportId: !matchingRide && matchingReport ? matchingReport._id : undefined,
      tag: item.tag,
      text: item.text,
      driverReply: item.reply || undefined,
      status: 'visible',
      source: 'seed',
      isPrototypeData: true,
      createdAt: new Date(timeOffset),
    });
    commentCount++;
  }

  // Add route-level comments for local fare
  const routeComments = [
    { rider: demoUser, plate: 'MH31AB1024', routeKey: 'Sitaburdi|Ganesh Peth Bus Stop', tag: 'Fair Fare', text: 'Usually around ₹20 for this route.' },
    { rider: riders[2], plate: 'MH31EF2208', routeKey: 'Sitabuldi|Railway Station', tag: 'Used Meter', text: '₹30 by meter, very standard rate.' },
    { rider: riders[3], plate: 'MH31CD8451', routeKey: 'Airport|Dharampeth', tag: 'Fair Fare', text: 'Expect around ₹150–170 depending on traffic.' },
  ];

  for (const rc of routeComments) {
    await Comment.create({
      riderId: rc.rider._id,
      plateNumber: rc.plate,
      routeKey: rc.routeKey,
      tag: rc.tag,
      text: rc.text,
      status: 'visible',
      source: 'seed',
      isPrototypeData: true,
      createdAt: new Date(),
    });
    commentCount++;
  }

  console.log(`Generated ${commentCount} prototype comments.`);

  console.log('Generating realistic prototype RTO escalations...');
  // Find flagged report for MH31JK7781 filed by demoUser or other user
  const flaggedReport = await Report.findOne({ plateNumber: 'MH31JK7781', status: 'PatternConfirmed' }) || (await Report.findOne({ plateNumber: 'MH31JK7781' }));
  const npReport = await Report.findOne({ plateNumber: 'MH31NP5620' });
  const cdReport = await Report.findOne({ plateNumber: 'MH31CD8451' });

  const seededEscalations = [
    {
      escalationId: 'RTO-0001',
      reportId: flaggedReport ? flaggedReport._id : allReportsCreated[0]._id,
      userId: demoUser._id,
      plateNumber: 'MH31JK7781',
      complaintType: 'Overcharging',
      subject: 'Complaint regarding auto-rickshaw fare irregularity — Vehicle MH31JK7781',
      complaintText: `To,\nThe Regional Transport Officer (RTO),\nNagpur, Maharashtra.\n\nSubject: Complaint regarding auto-rickshaw fare irregularity — Vehicle MH31JK7781\n\nRespected Sir/Madam,\n\nI am writing to formally report repeated fare irregularities regarding auto-rickshaw MH31JK7781. Multiple commuters have reported meter refusal and overcharging.\n\nIncident Details:\n- Vehicle: MH31JK7781\n- Issue: Overcharging / Refused Meter\n- Route: Sitabuldi → Ganesh Peth\n- Community Corroboration: 4 matching reports recorded within 30 days\n\nSincerely,\nDemo User (OrangeFair Commuter)`,
      incidentDetails: {
        route: 'Sitabuldi → Ganesh Peth',
        observedFare: 60,
        expectedFare: 30,
        incidentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        corroboratingReportsCount: 4,
        evidenceSummary: '4 corroborating OrangeFair reports recorded within 30 days.',
      },
      status: 'User Submitted',
      externalReferenceNumber: 'DEMO-RTO-001',
      submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      source: 'orangefair',
      isPrototypeData: true,
    },
    {
      escalationId: 'RTO-0002',
      reportId: npReport ? npReport._id : allReportsCreated[1]._id,
      userId: demoUser._id,
      plateNumber: 'MH31NP5620',
      complaintType: 'Meter Refusal',
      subject: 'Complaint regarding auto-rickshaw fare irregularity — Vehicle MH31NP5620',
      complaintText: `To,\nThe Regional Transport Officer (RTO),\nNagpur, Maharashtra.\n\nSubject: Complaint regarding auto-rickshaw fare irregularity — Vehicle MH31NP5620\n\nRespected Sir/Madam,\n\nReporting persistent refusal to engage the fare meter on short routes.\n\nIncident Details:\n- Vehicle: MH31NP5620\n- Issue: Refused Short Trip & Refused Meter\n- Route: Medical Square → Sadar\n\nSincerely,\nDemo User`,
      incidentDetails: {
        route: 'Medical Square → Sadar',
        observedFare: 80,
        expectedFare: 50,
        incidentDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        corroboratingReportsCount: 2,
        evidenceSummary: '2 corroborating OrangeFair reports recorded.',
      },
      status: 'Prepared',
      source: 'orangefair',
      isPrototypeData: true,
    },
    {
      escalationId: 'RTO-0003',
      reportId: cdReport ? cdReport._id : allReportsCreated[2]._id,
      userId: demoUser._id,
      plateNumber: 'MH31CD8451',
      complaintType: 'Repeated Fare Irregularity',
      subject: 'Complaint regarding auto-rickshaw fare irregularity — Vehicle MH31CD8451',
      complaintText: `To,\nThe Regional Transport Officer (RTO),\nNagpur, Maharashtra.\n\nSubject: Complaint regarding auto-rickshaw fare irregularity — Vehicle MH31CD8451\n\nRespected Sir/Madam,\n\nFormal escalation regarding frequent fare deviations observed on vehicle MH31CD8451.\n\nSincerely,\nDemo User`,
      incidentDetails: {
        route: 'Sitabuldi → Dharampeth',
        observedFare: 45,
        expectedFare: 30,
        incidentDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        corroboratingReportsCount: 3,
        evidenceSummary: '3 corroborating OrangeFair reports recorded.',
      },
      status: 'Under Review',
      externalReferenceNumber: 'RTO-NAG-882194',
      submissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      source: 'orangefair',
      isPrototypeData: true,
    },
  ];

  for (const esc of seededEscalations) {
    await RTOEscalation.create(esc);
  }

  console.log('Prototype data generated successfully with coherent comments, reports, and RTO escalations!');
};

module.exports = { seedData };

