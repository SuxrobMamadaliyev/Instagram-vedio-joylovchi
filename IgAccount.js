const mongoose = require('mongoose');

const igAccountSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  igUserId: { type: String, required: true },
  pageId: { type: String },
  connectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IgAccount', igAccountSchema);
