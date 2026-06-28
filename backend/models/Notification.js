const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // The phone number of the user receiving the notification
  type: { type: String, required: true }, // e.g., 'comment'
  message: { type: String, required: true },
  relatedId: { type: String, required: false }, // e.g., postId
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
