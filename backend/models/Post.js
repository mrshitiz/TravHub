const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  agencyName: { type: String, required: true },
  agencyLogo: { type: String, default: '' },
  city: { type: String, default: '' },
  content: { type: String, required: false },
  images: [{ type: String }],
  image: { type: String, default: '' },
  postType: { type: String, default: 'b2c' }, // 'b2b' or 'b2c'
  comments: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Post', postSchema);
