const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderPhone: { type: String, required: true },
  text: { type: String, default: '' },
  time: { type: String, default: '' },
  read: { type: Boolean, default: false },
  received: { type: Boolean, default: false },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  fileType: { type: String, default: '' }, // 'image' or 'pdf'
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
