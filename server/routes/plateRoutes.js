const express = require('express');
const { getPlateDetails } = require('../controllers/plateController');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/:plateNumber', apiLimiter, getPlateDetails);

module.exports = router;
