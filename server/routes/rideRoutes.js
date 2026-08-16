const express = require('express');
const { createRide, splitRideFare } = require('../controllers/rideController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, createRide);
router.post('/split', splitRideFare);

module.exports = router;
