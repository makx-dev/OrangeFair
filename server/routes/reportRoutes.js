const express = require('express');
const { createReport, getMyReports, getReportDetail, getReportStatus } = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', apiLimiter, authMiddleware, createReport);
router.get('/my', apiLimiter, authMiddleware, getMyReports);
router.get('/:id', apiLimiter, authMiddleware, getReportDetail);
router.get('/:id/status', apiLimiter, getReportStatus);

module.exports = router;

