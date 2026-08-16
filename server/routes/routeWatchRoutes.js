const express = require('express');
const { getRouteWatch } = require('../controllers/routeWatchController');

const router = express.Router();

router.get('/', getRouteWatch);

module.exports = router;
