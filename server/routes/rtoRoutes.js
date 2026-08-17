const express = require('express');
const {
  checkEligibility,
  prepareComplaint,
  getMyEscalations,
  getEscalationById,
  markSubmitted,
} = require('../controllers/rtoController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/eligibility/:reportId', apiLimiter, authMiddleware, checkEligibility);
router.post('/prepare/:reportId', apiLimiter, authMiddleware, prepareComplaint);
router.get('/escalations', apiLimiter, authMiddleware, getMyEscalations);
router.get('/escalations/:id', apiLimiter, authMiddleware, getEscalationById);
router.patch('/escalations/:id/submit', apiLimiter, authMiddleware, markSubmitted);

module.exports = router;
