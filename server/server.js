const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const plateRoutes = require('./routes/plateRoutes');
const rideRoutes = require('./routes/rideRoutes');
const reportRoutes = require('./routes/reportRoutes');
const commentRoutes = require('./routes/commentRoutes');
const routeWatchRoutes = require('./routes/routeWatchRoutes');
const localFareRoutes = require('./routes/localFareRoutes');
const rtoRoutes = require('./routes/rtoRoutes');
const { seedLocalFareData } = require('./seed/localFareData');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('The Orange Fare API is running');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'The Orange Fare API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/plates', plateRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/rto', rtoRoutes);
app.use('/api/routewatch', routeWatchRoutes);
app.use('/api/local-fare', localFareRoutes);
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));

const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('MongoDB connected');
      seedLocalFareData();
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
    });
} else {
  console.warn('MONGODB_URI not set. API will run without DB connection.');
}

const https = require('https');
const RENDER_URL = 'https://the-orange-fare.onrender.com/api/health';

// Ping the server every 14 minutes to prevent Render from sleeping
setInterval(() => {
  https.get(RENDER_URL, (res) => {
    if (res.statusCode === 200) {
      console.log('Self-ping successful to keep Render awake');
    } else {
      console.error(`Self-ping failed with status code: ${res.statusCode}`);
    }
  }).on('error', (err) => {
    console.error('Self-ping error:', err.message);
  });
}, 14 * 60 * 1000); // 14 minutes

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
