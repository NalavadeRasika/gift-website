const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  name: String,
  createdAt: { type: Date, default: Date.now },
  isBlocked: { type: Boolean, default: false }
  
});

module.exports = mongoose.model('User', userSchema);