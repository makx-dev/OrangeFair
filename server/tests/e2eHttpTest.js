const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function runE2ETests() {
  console.log('====================================================');
  console.log('ORANGEFAIR LIVE END-TO-END HTTP WORKFLOW TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
    }
  }

  // 1. Health & Server Check
  console.log('1. Testing Health & API Connectivity...');
  const healthRes = await axios.get(`${API_BASE}/health`);
  assert(healthRes.status === 200 && healthRes.data?.status === 'ok', 'Server is healthy and responding on /api/health');

  // 2. Demo User Authentication
  console.log('\n2. Testing Demo User Sign In...');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'demo@orangefair.local',
    password: 'Demo@123',
  });
  assert(loginRes.status === 200 && loginRes.data?.token, 'Demo user successfully authenticated');
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Demo Scenario 1: Community Comments & Trusted Vehicle
  console.log('\n3. Testing Demo 1 — Trusted Vehicle & Community Comments CRUD (MH31AB1024)...');
  const trustedPlateRes = await axios.get(`${API_BASE}/plates/MH31AB1024`);
  assert(trustedPlateRes.status === 200, 'Plate details endpoint for MH31AB1024 returned 200');
  assert(trustedPlateRes.data?.trust?.tier === 'Trusted', 'MH31AB1024 correctly derived as "Trusted" tier');
  assert(trustedPlateRes.data?.verification?.verified === true, 'MH31AB1024 verified with RTO source');

  const commentsPlateRes = await axios.get(`${API_BASE}/comments/plate/MH31AB1024`);
  assert(commentsPlateRes.status === 200 && commentsPlateRes.data?.comments?.length > 0, 'Plate has verified community experiences');

  // Create new comment as Demo User
  const newCommentRes = await axios.post(
    `${API_BASE}/comments`,
    {
      plateNumber: 'MH31AB1024',
      tag: 'Helpful Driver',
      text: 'Driver helped with luggage and charged fair meter amount.',
    },
    { headers: authHeaders }
  );
  assert(newCommentRes.status === 201 && newCommentRes.data?._id, 'Demo user can post a verified community experience');
  const myCommentId = newCommentRes.data._id;

  // Edit own comment
  const editCommentRes = await axios.patch(
    `${API_BASE}/comments/${myCommentId}`,
    {
      tag: 'Safe Driving',
      text: 'Smooth and very polite experience throughout.',
    },
    { headers: authHeaders }
  );
  assert(editCommentRes.status === 200 && editCommentRes.data?.comment?.tag === 'Safe Driving', 'Author can edit own experience');

  // 100 character limit enforcement
  try {
    await axios.post(
      `${API_BASE}/comments`,
      { plateNumber: 'MH31AB1024', tag: 'Polite', text: 'X'.repeat(101) },
      { headers: authHeaders }
    );
    assert(false, '100 character limit failed to reject overflow');
  } catch (err) {
    assert(err.response?.status === 400, 'Comment text exceeding 100 characters is rejected with 400 Bad Request');
  }

  // Delete own comment
  const deleteCommentRes = await axios.delete(`${API_BASE}/comments/${myCommentId}`, {
    headers: authHeaders,
  });
  assert(deleteCommentRes.status === 200, 'Author can successfully delete own comment');

  // 4. Demo Scenario 2: Problem Vehicle (MH31JK7781)
  console.log('\n4. Testing Demo 2 — Problem Vehicle (MH31JK7781)...');
  const flaggedPlateRes = await axios.get(`${API_BASE}/plates/MH31JK7781`);
  assert(flaggedPlateRes.status === 200, 'Plate details for MH31JK7781 returned 200');
  assert(flaggedPlateRes.data?.trust?.tier === 'Flagged', 'MH31JK7781 correctly identified as "Flagged" problem vehicle');
  assert(flaggedPlateRes.data?.trust?.stats?.confirmedReportCount > 0, 'Flagged vehicle reflects corroborated PatternConfirmed issues');

  // 5. Demo Scenario 3: Report History & Timeline
  console.log('\n5. Testing Demo 3 — Report History & Lifecycle Tracker...');
  const myReportsRes = await axios.get(`${API_BASE}/reports/my`, { headers: authHeaders });
  assert(myReportsRes.status === 200 && myReportsRes.data?.reports?.length > 0, 'My Reports history retrieved successfully');

  // Find a report with PatternConfirmed or UnderReview
  const testReport = myReportsRes.data.reports.find((r) => r.status === 'PatternConfirmed') || myReportsRes.data.reports[0];
  const reportDetailRes = await axios.get(`${API_BASE}/reports/${testReport._id}`, { headers: authHeaders });
  assert(reportDetailRes.status === 200, 'Report detail endpoint returned 200');
  assert(Boolean(reportDetailRes.data?.reportCode), 'Report includes official code (e.g. #OF-XXXX)');
  assert(Boolean(reportDetailRes.data?.explanation), 'Report includes lifecycle explanation');

  // 6. Demo Scenario 4: RTO Escalation Workflow
  console.log('\n6. Testing Demo 4 — RTO Complaint Preparation & Tracking...');
  // Find or create PatternConfirmed report for MH31JK7781
  const allFlaggedReports = await axios.get(`${API_BASE}/reports/my?status=PatternConfirmed`, { headers: authHeaders });
  const targetReport = allFlaggedReports.data?.reports?.find(r => r.plateNumber === 'MH31JK7781') || myReportsRes.data.reports[0];

  const rtoEligRes = await axios.get(`${API_BASE}/rto/eligibility/${targetReport._id}`, { headers: authHeaders });
  assert(rtoEligRes.status === 200 && rtoEligRes.data?.isEligible === true, 'Pattern-confirmed report is eligible for RTO escalation');

  const rtoPrepRes = await axios.post(`${API_BASE}/rto/prepare/${targetReport._id}`, {}, { headers: authHeaders });
  assert(rtoPrepRes.status === 200 && rtoPrepRes.data?.escalation?.complaintText, 'Structured RTO complaint text generated from actual data');
  const escalationId = rtoPrepRes.data.escalation._id;

  // Mark as submitted
  const rtoSubmitRes = await axios.patch(
    `${API_BASE}/rto/escalations/${escalationId}/submit`,
    { externalReferenceNumber: 'DEMO-RTO-001', submissionDate: '2026-08-18' },
    { headers: authHeaders }
  );
  assert(rtoSubmitRes.status === 200 && rtoSubmitRes.data?.escalation?.status === 'User Submitted', 'User can record submission with reference number DEMO-RTO-001');

  const myEscalationsRes = await axios.get(`${API_BASE}/rto/escalations`, { headers: authHeaders });
  assert(
    myEscalationsRes.status === 200 &&
    myEscalationsRes.data?.escalations?.some((e) => e.externalReferenceNumber === 'DEMO-RTO-001'),
    'Escalations appear in user-scoped RTO tracking history'
  );

  // 7. Demo Scenario 5: Settings & Preferences Persistence
  console.log('\n7. Testing Demo 5 — Settings Page & Multi-Language Persistence...');
  const meInitial = await axios.get(`${API_BASE}/auth/me`, { headers: authHeaders });
  assert(meInitial.status === 200 && meInitial.data?.user?.email === 'demo@orangefair.local', 'Fetched initial user profile');

  // Change language: English -> Marathi
  const updateMr = await axios.patch(
    `${API_BASE}/auth/profile`,
    { preferences: { language: 'mr' } },
    { headers: authHeaders }
  );
  assert(updateMr.status === 200 && updateMr.data?.user?.preferences?.language === 'mr', 'Language updated to Marathi and persisted in backend');

  // Change language: Marathi -> Hindi
  const updateHi = await axios.patch(
    `${API_BASE}/auth/profile`,
    { preferences: { language: 'hi' } },
    { headers: authHeaders }
  );
  assert(updateHi.status === 200 && updateHi.data?.user?.preferences?.language === 'hi', 'Language updated to Hindi and persisted in backend');

  // Update notifications and display name
  const updatePrefs = await axios.patch(
    `${API_BASE}/auth/profile`,
    {
      name: 'Demo User (Verified)',
      preferences: {
        language: 'en',
        notifications: { reportUpdates: true, communityActivity: false, accountNotifications: true },
        profileVisibility: 'public',
      },
    },
    { headers: authHeaders }
  );
  assert(updatePrefs.status === 200 && updatePrefs.data?.user?.name === 'Demo User (Verified)', 'Profile display name and notification preferences successfully persisted');

  // 8. Other Platform Systems Check (Local Fare, Fair Split, Leaderboard, Route Watch)
  console.log('\n8. Testing Remaining Core Systems (Local Fare, Route Watch, Leaderboard)...');
  const routeWatchRes = await axios.get(`${API_BASE}/routewatch`);
  assert(routeWatchRes.status === 200, 'Route Watch API responding');

  const leaderboardRes = await axios.get(`${API_BASE}/leaderboard`);
  assert(leaderboardRes.status === 200, 'Leaderboard API responding');

  const localFareEstRes = await axios.get(`${API_BASE}/local-fare/estimate`, {
    params: {
      pickupLat: 21.1460,
      pickupLng: 79.0897,
      dropLat: 21.1377,
      dropLng: 79.0688,
      rideType: 'shared',
      distanceKm: 2.0,
    },
  });
  assert(localFareEstRes.status === 200 && localFareEstRes.data?.hasData === true, 'Local Fare estimate API returning community intelligence');

  console.log('\n====================================================');
  console.log(`TOTAL RESULT: ${passed} / ${total} DEMO WORKFLOW TESTS PASSED`);
  console.log('====================================================\n');
}

runE2ETests().catch((err) => {
  console.error('Fatal E2E test failure:', err.message, err.response?.data || '');
  process.exit(1);
});
