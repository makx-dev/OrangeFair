const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedData } = require('./prototypeData');

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI not found in environment variables.');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected for seeding prototype data...');
    try {
      await seedData();
      console.log('Seeding complete. Exiting...');
      process.exit(0);
    } catch (error) {
      console.error('Error during seeding:', error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });
