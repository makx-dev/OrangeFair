const express = require('express');
const { createComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, createComment);

module.exports = router;
