const express = require('express');
const { createComment, replyToComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', apiLimiter, authMiddleware, createComment);
router.patch('/:id/reply', apiLimiter, authMiddleware, replyToComment);

module.exports = router;
