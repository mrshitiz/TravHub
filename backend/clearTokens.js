const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/travhub';

mongoose.connect(mongoURI)
  .then(async () => {
    console.log('Connected to MongoDB');
    const result = await User.updateMany({}, { $set: { fcmTokens: [] } });
    console.log(`Cleared tokens for ${result.modifiedCount} users.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
