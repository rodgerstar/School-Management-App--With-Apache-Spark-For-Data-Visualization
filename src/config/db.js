const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1); // Stop the app if DB fails
  }
};

module.exports = connectDB;