const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  phone: { type: String, required: true },
  agencyName: { type: String, required: true },
  agencyLogo: { type: String, default: '' },
  city: { type: String, default: '' },
  text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
