const express = require('express');
const { getPlateDetails } = require('../controllers/plateController');

const router = express.Router();

router.get('/:plateNumber', getPlateDetails);

module.exports = router;
