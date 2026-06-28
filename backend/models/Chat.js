const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // Array of phone numbers
  participantDetails: { type: Object, default: {} }, // Cache of user details
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: String, default: '' },
  lastSender: { type: String, default: '' },
  unread: { type: Boolean, default: false },
  unreadCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
