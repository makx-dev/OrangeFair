const express = require('express');
const {
  createComment,
  getMyComments,
  getPlateComments,
  updateComment,
  deleteComment,
  reportComment,
  replyToComment,
} = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', apiLimiter, authMiddleware, createComment);
router.get('/my', apiLimiter, authMiddleware, getMyComments);
router.get('/plate/:plateNumber', apiLimiter, getPlateComments);
router.patch('/:id', apiLimiter, authMiddleware, updateComment);
router.delete('/:id', apiLimiter, authMiddleware, deleteComment);
router.post('/:id/report', apiLimiter, authMiddleware, reportComment);
router.patch('/:id/reply', apiLimiter, authMiddleware, replyToComment);

module.exports = router;

