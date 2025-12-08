const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, trim: true, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // hashed
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
