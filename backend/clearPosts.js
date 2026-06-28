const mongoose = require('mongoose');
const Post = require('./models/Post');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travhub'; 

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Clearing posts...');
    const result = await Post.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} posts.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error connecting to DB or deleting posts:', err);
    process.exit(1);
  });
