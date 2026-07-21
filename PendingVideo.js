const mongoose = require('mongoose');

const pendingVideoSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  videoUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // 1 soatdan keyin avto o'chadi
});

module.exports = mongoose.model('PendingVideo', pendingVideoSchema);
