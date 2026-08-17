const express = require('express');
const { register, login, googleAuth } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);


module.exports = router;
