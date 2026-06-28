const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dm99z4ybh',
  api_key: '797813764543377',
  api_secret: 'Kb7THARSPtAfXdj4JWLCTf1UrPU'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folderName = req.query.folder || 'posts';
    return {
      folder: 'TravHub/' + folderName,
      public_id: Date.now() + '-' + Math.round(Math.random() * 1E9),
    };
  },
});
const upload = multer({ storage: storage });
const Post = require('../models/Post');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const firebaseAdmin = require('../firebase');

// --- NOTIFICATIONS ---
// Public key route no longer needed for FCM, removed to keep API clean.


router.post('/notifications/subscribe', async (req, res) => {
  try {
    const { phone, fcmToken } = req.body;
    await User.findOneAndUpdate(
      { phone },
      { $addToSet: { fcmTokens: fcmToken } }
    );
    res.status(201).json({});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notifications/unsubscribe', async (req, res) => {
  try {
    const { phone, fcmToken } = req.body;
    await User.findOneAndUpdate(
      { phone },
      { $pull: { fcmTokens: fcmToken } }
    );
    res.status(200).json({});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/notifications/user/:phone', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.phone }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notifications/read', async (req, res) => {
  try {
    const { ids } = req.body;
    await Notification.updateMany({ _id: { $in: ids } }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AUTH & USERS ---

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    const user = await User.findOne({ phone, password: pin });
    if (!user) return res.status(401).json({ error: 'Invalid mobile number or PIN.' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Check if user exists
router.get('/users/exists/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    res.json({ exists: !!user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ id: user._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get User by Phone
router.get('/users/:phone', async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get User by Name and City
router.get('/users/find/query', async (req, res) => {
  try {
    const { agencyName, city } = req.query;
    const user = await User.findOne({ agencyName, city });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update Profile
router.put('/users/:phone', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ phone: req.params.phone }, req.body, { new: true });
    
    // Sync to chats... (Simplified for now, in a real app you'd run a background job)
    const chats = await Chat.find({ participants: req.params.phone });
    for (let chat of chats) {
      if (chat.participantDetails && chat.participantDetails[req.params.phone]) {
        Object.assign(chat.participantDetails[req.params.phone], req.body);
        chat.markModified('participantDetails');
        await chat.save();
      }
    }

    // Sync to Posts and Comments
    if (req.body.agencyLogo !== undefined) {
      await Post.updateMany({ phone: req.params.phone }, { $set: { agencyLogo: req.body.agencyLogo } });
      await Comment.updateMany({ phone: req.params.phone }, { $set: { agencyLogo: req.body.agencyLogo } });
    }
    
    const io = req.app.get('io');
    if (io) {
      io.emit('profile_updated', { phone: req.params.phone, updates: req.body });
    }

    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle Save Post
router.post('/users/:phone/save/:postId', async (req, res) => {
  try {
    const { isSaved } = req.body;
    const update = isSaved 
      ? { $addToSet: { savedPosts: req.params.postId } }
      : { $pull: { savedPosts: req.params.postId } };
    await User.findOneAndUpdate({ phone: req.params.phone }, update);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- UPLOAD ---
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // multer-storage-cloudinary provides the secure URL in req.file.path
    const fileUrl = req.file.path;
    res.json({ fileUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FEED ---

// Get Feed (Pagination)
router.get('/feed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const lastTimestamp = req.query.lastTimestamp;
    
    let query = {};
    if (lastTimestamp) {
      query.createdAt = { $lt: new Date(lastTimestamp) };
    }
    const posts = await Post.find(query).sort({ createdAt: -1 }).limit(limit);
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get new feeds
router.get('/feed/new', async (req, res) => {
  try {
    const { latestTimestamp } = req.query;
    if (!latestTimestamp) return res.json([]);
    const posts = await Post.find({ createdAt: { $gt: new Date(latestTimestamp) } }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get Single Post
router.get('/feed/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create Post
router.post('/feed', async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    const io = req.app.get('io');
    if (io) {
      io.emit('new_post', post);
    }
    res.json({ id: post._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete Post
router.delete('/feed/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    if (post.images && post.images.length > 0) {
      post.images.forEach(async (imgUrl) => {
        try {
          if (imgUrl.includes('cloudinary.com')) {
            // Extract public_id: e.g. "TravHub/posts/12345678" from the URL
            const parts = imgUrl.split('/');
            const filenameWithExt = parts.pop();
            const folder = parts.pop();
            const parentFolder = parts.pop();
            const publicId = `${parentFolder}/${folder}/${filenameWithExt.split('.')[0]}`;
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (e) {
          console.error('Error deleting image from Cloudinary:', e);
        }
      });
    }
    
    await Post.findByIdAndDelete(req.params.id);
    const io = req.app.get('io');
    if (io) {
      io.emit('post_deleted', req.params.id);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- COMMENTS ---

// Get Comments
router.get('/feed/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add Comment
router.post('/feed/:postId/comments', async (req, res) => {
  try {
    const comment = new Comment({ ...req.body, postId: req.params.postId });
    await comment.save();
    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, { $inc: { comments: 1 } }, { new: true });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('new_comment', { postId: req.params.postId, commentsCount: updatedPost.comments, comment });
    }

    // Send Web Push Notification to the post author & In-App Notification
    try {
      const post = await Post.findById(req.params.postId);
      if (post && post.phone && post.phone !== req.body.phone) {
        const commenterName = req.body.agencyName || 'Someone';
        
        // --- In-App Notification ---
        const notification = new Notification({
          userId: post.phone,
          type: 'comment',
          message: `${commenterName} commented on your post`,
          relatedId: req.params.postId,
        });
        await notification.save();
        
        if (io) {
          io.emit('new_notification', notification);
        }

        // --- Web Push Notification (FCM) ---
        const postAuthorUser = await User.findOne({ phone: post.phone });
        if (postAuthorUser && postAuthorUser.fcmTokens && postAuthorUser.fcmTokens.length > 0) {
          const messagePayload = {
            notification: {
              title: `💬 New Comment from ${commenterName}`,
              body: comment.text,
            },
            data: { url: `/` },
          };
          
          for (let token of postAuthorUser.fcmTokens) {
            try {
              await firebaseAdmin.messaging.send({ ...messagePayload, token });
            } catch (err) {
              if (err.code === 'messaging/invalid-registration-token' || err.code === 'messaging/registration-token-not-registered') {
                User.updateOne({ phone: post.phone }, { $pull: { fcmTokens: token } }).exec();
              }
            }
          }
        }
      }
    } catch (e) { console.error('Error sending push/in-app notification for comment:', e); }

    res.json({ id: comment._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CHATS ---

// Get user chats
router.get('/chats/user/:phone', async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.params.phone }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mark chat as read
router.post('/chats/:chatId/read', async (req, res) => {
  try {
    await Chat.findByIdAndUpdate(req.params.chatId, {
      unread: false,
      unreadCount: 0
    });
    const io = req.app.get('io');
    if (io) {
      io.emit('chat_update');
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start or create chat
router.post('/chats', async (req, res) => {
  try {
    const { myUser, targetUser } = req.body;
    let chat = await Chat.findOne({ participants: { $all: [myUser.phone, targetUser.phone] } });
    
    if (!chat) {
      chat = new Chat({
        participants: [myUser.phone, targetUser.phone],
        participantDetails: {
          [myUser.phone]: { agencyName: myUser.agencyName, city: myUser.city, agencyLogo: myUser.agencyLogo, handlingPerson: myUser.handlingPerson },
          [targetUser.phone]: { agencyName: targetUser.agencyName, city: targetUser.city, agencyLogo: targetUser.agencyLogo, handlingPerson: targetUser.handlingPerson }
        },
        lastMessage: 'Chat started',
        lastMessageTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      });
      await chat.save();
    }
    res.json(chat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get chat messages
router.get('/chats/:chatId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: -1 }).limit(50);
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Send message
router.post('/chats/:chatId/messages', async (req, res) => {
  try {
    const msg = new Message({ ...req.body, chatId: req.params.chatId });
    await msg.save();
    
    const timeString = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    let lastMsgText = msg.text;
    if (msg.fileUrl) {
      lastMsgText = msg.fileType === 'image' ? '📷 Image' : `📄 PDF: ${msg.fileName || 'document.pdf'}`;
    }

    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: lastMsgText,
      lastMessageTime: timeString,
      lastSender: msg.senderPhone,
      unread: true,
      $inc: { unreadCount: 1 }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('new_message', { chatId: req.params.chatId, message: msg });
      io.emit('chat_update');
    }

    res.json(msg);

    // Send Web Push Notification to the recipient
    try {
      const chat = await Chat.findById(req.params.chatId);
      const recipientPhone = chat.participants.find(p => p !== msg.senderPhone);
      if (recipientPhone) {
        const recipientUser = await User.findOne({ phone: recipientPhone });
        // --- Web Push Notification (FCM) ---
        if (recipientUser && recipientUser.fcmTokens && recipientUser.fcmTokens.length > 0) {
          const messagePayload = {
            notification: {
              title: `💬 New Chat from ${chat.participantDetails[msg.senderPhone]?.agencyName || msg.senderPhone}`,
              body: lastMsgText,
            },
            data: {
              url: `/chats/${req.params.chatId}`,
              chatId: req.params.chatId.toString()
            }
          };
          
          for (let token of recipientUser.fcmTokens) {
            try {
              await firebaseAdmin.messaging.send({ ...messagePayload, token });
            } catch (err) {
              if (err.code === 'messaging/invalid-registration-token' || err.code === 'messaging/registration-token-not-registered') {
                User.updateOne({ phone: recipientPhone }, { $pull: { fcmTokens: token } }).exec();
              }
            }
          }
        }
      }
    } catch (e) { console.error('Error sending web push:', e); }

  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
