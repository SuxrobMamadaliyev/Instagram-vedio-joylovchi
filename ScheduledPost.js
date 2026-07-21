const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  videoUrl: { type: String, required: true },
  caption: { type: String, default: '' },
  intervalMs: { type: Number, required: true },
  nextRun: { type: Date, required: true },
  active: { type: Boolean, default: true },
  lastStatus: { type: String, default: 'pending' }, // pending | success | error
  lastError: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
