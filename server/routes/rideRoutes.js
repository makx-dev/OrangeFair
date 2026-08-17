const express = require('express');
const { createRide, splitRideFare, getMyRides } = require('../controllers/rideController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', apiLimiter, authMiddleware, createRide);
router.get('/my', apiLimiter, authMiddleware, getMyRides);
router.post('/split', apiLimiter, splitRideFare);

module.exports = router;

