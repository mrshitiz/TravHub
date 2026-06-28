const mongoose = require('mongoose');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/travhub';

async function syncComments() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const posts = await Post.find({});
    let updatedCount = 0;

    for (let post of posts) {
      const realCommentCount = await Comment.countDocuments({ postId: post._id });
      if (post.comments !== realCommentCount) {
        post.comments = realCommentCount;
        await post.save();
        updatedCount++;
      }
    }

    console.log(`Successfully synced comments for ${updatedCount} posts.`);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing comments:', err);
    process.exit(1);
  }
}

syncComments();
