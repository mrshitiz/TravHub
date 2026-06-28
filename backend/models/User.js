const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  agencyName: { type: String, default: '' },
  city: { type: String, default: '' },
  agencyLogo: { type: String, default: '💼' },
  userType: { type: String, default: 'viewer' },
  agencyType: { type: String, default: '' },
  hotelCategory: { type: String, default: '' },
  specializations: [{ type: String }],
  gstin: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, default: 'none' },
  bio: { type: String, default: '' },
  streetAddress: { type: String, default: '' },
  country: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  handlingPerson: { type: String, default: '' },
  handlingPosition: { type: String, default: '' },
  email: { type: String, default: '' },
  followers: [{ type: String }],
  following: [{ type: String }],
  savedPosts: [{ type: String }],
  fcmTokens: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
