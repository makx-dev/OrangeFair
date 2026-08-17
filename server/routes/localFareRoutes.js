const express = require('express');
const router = express.Router();
const localFareController = require('../controllers/localFareController');
const authMiddleware = require('../middleware/auth');

// Get local fare estimate (public or authenticated)
router.get('/estimate', localFareController.getEstimate);

// Submit new fare observation (optional auth)
// We use a custom middleware approach to optionally set req.user if token is present
const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    // try to authenticate, but don't fail if invalid
    try {
      await authMiddleware(req, res, () => {});
    } catch (err) {}
  }
  next();
};

router.post('/observations', optionalAuth, localFareController.submitObservation);

// Fetch comments for a specific route
router.get('/comments', localFareController.getComments);

module.exports = router;
