const express = require('express');
const { createReport, getReportStatus } = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, createReport);
router.get('/:id/status', getReportStatus);

module.exports = router;
