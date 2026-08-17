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
app.use('/api/routewatch', routeWatchRoutes);

const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log('MongoDB connected');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error.message);
    });
} else {
  console.warn('MONGODB_URI not set. API will run without DB connection.');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
