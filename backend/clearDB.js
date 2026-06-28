const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Comment = require('./models/Comment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travhub'; 

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Wiping database...');
    
    const postRes = await Post.deleteMany({});
    console.log(`Deleted ${postRes.deletedCount} posts.`);
    
    const userRes = await User.deleteMany({});
    console.log(`Deleted ${userRes.deletedCount} users.`);
    
    const chatRes = await Chat.deleteMany({});
    console.log(`Deleted ${chatRes.deletedCount} chats.`);
    
    const msgRes = await Message.deleteMany({});
    console.log(`Deleted ${msgRes.deletedCount} messages.`);
    
    const commentRes = await Comment.deleteMany({});
    console.log(`Deleted ${commentRes.deletedCount} comments.`);
    
    console.log('Database successfully cleared.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error clearing DB:', err);
    process.exit(1);
  });
