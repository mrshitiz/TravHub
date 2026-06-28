const mongoose = require('mongoose');
const Post = require('./models/Post');

mongoose.connect('mongodb://localhost:27017/travhub').then(async () => {
  try {
    const posts = await Post.find({});
    console.log('TOTAL POSTS:', posts.length);
    posts.forEach(p => console.log(p._id, p.title, p.createdAt));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
});
