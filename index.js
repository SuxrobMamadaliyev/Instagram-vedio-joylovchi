require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');

const authRoutes = require('./auth');
const registerHandlers = require('./botHandlers');
const startScheduler = require('./scheduler');

const { BOT_TOKEN, MONGO_URI, PORT } = process.env;

const app = express();
const bot = new Telegraf(BOT_TOKEN);

// Video fayllarni public qilib berish (Instagram video_url shundan foydalanadi)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);

app.get('/', (req, res) => res.send('IG Autopost Bot ishlamoqda ✅'));

registerHandlers(bot);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB ulandi');

  // MUHIM: bot.launch() long-polling rejimida hech qachon resolve bo'lmaydi,
  // shuning uchun uni await qilmaymiz - aks holda server porti ochilmay qoladi
  bot.launch();
  console.log('✅ Telegram bot ishga tushdi');

  startScheduler(bot);

  app.listen(PORT || 3000, () => {
    console.log(`✅ Server ${PORT || 3000} portda ishlamoqda`);
  });
}

main().catch((err) => {
  console.error('❌ Ishga tushirishda xato:', err);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
