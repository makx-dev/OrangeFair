const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Plate = require('../models/Plate');
const Ride = require('../models/Ride');
const Report = require('../models/Report');
const Comment = require('../models/Comment');
const RTOEscalation = require('../models/RTOEscalation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');
const reportController = require('../controllers/reportController');
const rtoController = require('../controllers/rtoController');
const plateController = require('../controllers/plateController');

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runTests() {
  console.log('Connecting to MongoDB for full systems verification...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected successfully.\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
    }
  }

  // 1. Check Demo User Login
  console.log('--- Testing Authentication & Profile Systems ---');
  const demoUser = await User.findOne({ email: 'demo@orangefair.local' });
  assert(demoUser !== null, 'Demo user exists in database');

  const reqLogin = { body: { email: 'demo@orangefair.local', password: 'Demo@123' } };
  const resLogin = mockRes();
  await authController.login(reqLogin, resLogin);
  assert(resLogin.statusCode === 200 && resLogin.data?.token, 'Demo user login succeeds with valid JWT token');

  const token = resLogin.data.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret_change_me');

  // 2. Profile & Preferences Retrieval and Update
  const reqMe = { user: decoded };
  const resMe = mockRes();
  await authController.getMe(reqMe, resMe);
  assert(resMe.statusCode === 200 && resMe.data?.user?.email === 'demo@orangefair.local', 'getMe returns complete user profile');

  const reqUpdateProf = {
    user: decoded,
    body: {
      name: 'Demo User (Updated)',
      preferences: {
        language: 'mr',
        notifications: { reportUpdates: false, communityActivity: true, accountNotifications: true },
        profileVisibility: 'public',
      },
    },
  };
  const resUpdateProf = mockRes();
  await authController.updateProfile(reqUpdateProf, resUpdateProf);
  assert(resUpdateProf.statusCode === 200 && resUpdateProf.data?.user?.preferences?.language === 'mr', 'Profile & preferences persisted in DB');

  // Reset back to English for demo consistency
  await authController.updateProfile({
    user: decoded,
    body: { name: 'Demo User', preferences: { language: 'en' } }
  }, mockRes());

  // 3. Plate Query & Trust Calculation
  console.log('\n--- Testing Plate Profiles & Trust Derivation ---');
  const reqPlate1 = { params: { plateNumber: 'MH31AB1024' } };
  const resPlate1 = mockRes();
  await plateController.getPlateDetails(reqPlate1, resPlate1);
  assert(resPlate1.statusCode === 200 && resPlate1.data?.trust?.tier === 'Trusted', 'MH31AB1024 resolves to Trusted profile');
  assert(Array.isArray(resPlate1.data?.recentComments) && resPlate1.data.recentComments.length > 0, 'MH31AB1024 has rich verified comments');

  const reqPlate2 = { params: { plateNumber: 'MH31JK7781' } };
  const resPlate2 = mockRes();
  await plateController.getPlateDetails(reqPlate2, resPlate2);
  assert(resPlate2.statusCode === 200 && resPlate2.data?.trust?.tier === 'Flagged', 'MH31JK7781 resolves to Flagged problem vehicle');

  // 4. Comments CRUD & Backend Ownership Validation
  console.log('\n--- Testing Comment CRUD & Security Enforcements ---');
  const otherUser = await User.findOne({ email: 'rider1@prototype.local' });
  const otherTokenDecoded = { userId: otherUser._id, role: 'rider' };

  // Create comment
  const reqCreateComment = {
    user: decoded,
    body: {
      plateNumber: 'MH31AB1024',
      tag: 'Used Meter',
      text: 'Automated test verified meter ride.',
    },
  };
  const resCreateComment = mockRes();
  await commentController.createComment(reqCreateComment, resCreateComment);
  assert(resCreateComment.statusCode === 201 && resCreateComment.data?._id, 'User can create comment on auto profile');
  const createdCommentId = resCreateComment.data._id;

  // 100 character limit validation
  const reqLongComment = {
    user: decoded,
    body: {
      plateNumber: 'MH31AB1024',
      tag: 'Used Meter',
      text: 'A'.repeat(101),
    },
  };
  const resLongComment = mockRes();
  await commentController.createComment(reqLongComment, resLongComment);
  assert(resLongComment.statusCode === 400, 'Comments exceeding 100 characters are rejected with 400');

  // Read My Comments
  const reqMyComments = { user: decoded };
  const resMyComments = mockRes();
  await commentController.getMyComments(reqMyComments, resMyComments);
  assert(resMyComments.statusCode === 200 && resMyComments.data?.comments?.some(c => c._id.toString() === createdCommentId.toString()), 'Created comment appears in user comment history');

  // Update comment as Owner
  const reqUpdateComment = {
    user: decoded,
    params: { id: createdCommentId },
    body: { tag: 'Fair Fare', text: 'Updated comment text.' },
  };
  const resUpdateComment = mockRes();
  await commentController.updateComment(reqUpdateComment, resUpdateComment);
  assert(resUpdateComment.statusCode === 200 && resUpdateComment.data?.comment?.tag === 'Fair Fare', 'Author can successfully edit own comment');

  // Attempt to edit another user's comment (MUST FAIL WITH 403)
  const reqUnauthorizedEdit = {
    user: otherTokenDecoded,
    params: { id: createdCommentId },
    body: { tag: 'Overcharged', text: 'Malicious modification attempt' },
  };
  const resUnauthorizedEdit = mockRes();
  await commentController.updateComment(reqUnauthorizedEdit, resUnauthorizedEdit);
  assert(resUnauthorizedEdit.statusCode === 403, 'Unauthorized user editing another comment is blocked with 403');

  // Attempt to delete another user's comment (MUST FAIL WITH 403)
  const reqUnauthorizedDelete = {
    user: otherTokenDecoded,
    params: { id: createdCommentId },
  };
  const resUnauthorizedDelete = mockRes();
  await commentController.deleteComment(reqUnauthorizedDelete, resUnauthorizedDelete);
  assert(resUnauthorizedDelete.statusCode === 403, 'Unauthorized user deleting another comment is blocked with 403');

  // Delete own comment
  const reqDeleteOwn = {
    user: decoded,
    params: { id: createdCommentId },
  };
  const resDeleteOwn = mockRes();
  await commentController.deleteComment(reqDeleteOwn, resDeleteOwn);
  assert(resDeleteOwn.statusCode === 200, 'Author can successfully delete own comment');

  // 5. Reports & Lifecycle Tracking
  console.log('\n--- Testing Report Lifecycle & Tracking ---');
  const reqMyReports = { user: decoded, query: { status: 'All' } };
  const resMyReports = mockRes();
  await reportController.getMyReports(reqMyReports, resMyReports);
  assert(resMyReports.statusCode === 200 && Array.isArray(resMyReports.data?.reports), 'User reports list retrieved successfully');

  // Find a pattern-confirmed report
  const pcReport = await Report.findOne({ status: 'PatternConfirmed' });
  assert(pcReport !== null, 'PatternConfirmed report found in prototype DB');

  const reqReportDetail = { user: decoded, params: { id: pcReport._id } };
  const resReportDetail = mockRes();
  await reportController.getReportDetail(reqReportDetail, resReportDetail);
  assert(resReportDetail.statusCode === 200 && resReportDetail.data?.isEligibleForRto === true, 'PatternConfirmed report is marked eligible for RTO complaint escalation');
  assert(resReportDetail.data?.trustContributionExplanation !== null, 'Report detail provides verified trust contribution explanation');

  // 6. RTO Escalation System
  console.log('\n--- Testing RTO Escalation Workflow ---');
  // Check eligibility
  const reqRtoElig = { user: decoded, params: { reportId: pcReport._id } };
  const resRtoElig = mockRes();
  await rtoController.checkEligibility(reqRtoElig, resRtoElig);
  assert(resRtoElig.statusCode === 200 && resRtoElig.data?.isEligible === true, 'RTO eligibility check confirms qualification');

  // Prepare complaint
  // Temporarily set demoUser as owner for test
  pcReport.riderId = demoUser._id;
  await pcReport.save();

  const reqPrep = { user: decoded, params: { reportId: pcReport._id } };
  const resPrep = mockRes();
  await rtoController.prepareComplaint(reqPrep, resPrep);
  assert(resPrep.statusCode === 200 && resPrep.data?.escalation?.status === 'Prepared' || resPrep.data?.escalation?.status === 'User Submitted', 'Structured RTO complaint preview prepared from real data');
  const escalationId = resPrep.data.escalation._id;

  // Mark as submitted
  const reqMarkSub = {
    user: decoded,
    params: { id: escalationId },
    body: { externalReferenceNumber: 'DEMO-RTO-001', submissionDate: new Date() },
  };
  const resMarkSub = mockRes();
  await rtoController.markSubmitted(reqMarkSub, resMarkSub);
  assert(resMarkSub.statusCode === 200 && resMarkSub.data?.escalation?.status === 'User Submitted', 'User can record external submission with reference number');

  // Read My Escalations
  const reqMyEsc = { user: decoded };
  const resMyEsc = mockRes();
  await rtoController.getMyEscalations(reqMyEsc, resMyEsc);
  assert(resMyEsc.statusCode === 200 && resMyEsc.data?.escalations?.length > 0, 'User-scoped RTO escalations list retrieved');

  // Verify total summary counts
  const totalComments = await Comment.countDocuments();
  const totalReports = await Report.countDocuments();
  const totalEscalations = await RTOEscalation.countDocuments();
  assert(totalComments >= 40 && totalComments <= 60, `Prototype comments count (${totalComments}) is in target range 40–60`);
  assert(totalReports >= 20, `Prototype reports count (${totalReports}) is in target range ≥20`);
  assert(totalEscalations >= 3, `Prototype RTO escalations count (${totalEscalations}) is in target range 3–5`);

  console.log(`\n========================================`);
  console.log(`VERIFICATION RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log(`========================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
