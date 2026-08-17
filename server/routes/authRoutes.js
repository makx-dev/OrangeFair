const express = require('express');
const { register, login, googleAuth, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { authLimiter, apiLimiter } = require('../middleware/rateLimit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);

router.get('/me', apiLimiter, authMiddleware, getMe);
router.patch('/profile', apiLimiter, authMiddleware, updateProfile);
router.post('/change-password', authLimiter, authMiddleware, changePassword);

module.exports = router;

