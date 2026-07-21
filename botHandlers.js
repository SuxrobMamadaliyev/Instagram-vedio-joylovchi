const { Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const IgAccount = require('./IgAccount');
const PendingVideo = require('./PendingVideo');
const ScheduledPost = require('./ScheduledPost');
const { parseIntervalToMs, intervalLabel } = require('./helpers');

const { BASE_URL } = process.env;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function registerHandlers(bot) {
  bot.start((ctx) => {
    ctx.reply(
      `Salom! 👋\n\nBu bot orqali Instagram akkauntingizga video (Reels) avtomatik joylashingiz mumkin.\n\n` +
      `1️⃣ /connect — Instagram akkauntni ulash\n` +
      `2️⃣ Video yuboring — interval tanlaysiz\n` +
      `3️⃣ /list — rejalashtirilgan postlarni ko'rish\n` +
      `4️⃣ /stop — barcha rejalashtirilgan postlarni to'xtatish`
    );
  });

  bot.command('connect', async (ctx) => {
    const telegramId = ctx.from.id;
    const url = `${BASE_URL}/auth/instagram?telegramId=${telegramId}`;
    await ctx.reply(
      'Instagram akkauntingizni ulash uchun quyidagi havolani bosing:\n\n' +
      `${url}\n\n` +
      '⚠️ Eslatma: akkaunt Business/Creator turida va Facebook Page-ga bog\'langan bo\'lishi kerak.'
    );
  });

  bot.on('video', async (ctx) => {
    const telegramId = ctx.from.id;

    const account = await IgAccount.findOne({ telegramId });
    if (!account) {
      return ctx.reply('❗ Avval /connect orqali Instagram akkauntingizni ulang.');
    }

    await ctx.reply('⏳ Video qabul qilindi, saqlanmoqda...');

    try {
      const fileId = ctx.message.video.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);

      const fileName = `${telegramId}_${Date.now()}.mp4`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      const res = await fetch(fileLink.href);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `${BASE_URL}/uploads/${fileName}`;

      await PendingVideo.create({ telegramId, videoUrl: publicUrl });

      await ctx.reply(
        'Video qanday interval bilan joylanib borsin?',
        Markup.inlineKeyboard([
          [Markup.button.callback('1 soat', 'interval_1h'), Markup.button.callback('3 soat', 'interval_3h')],
          [Markup.button.callback('6 soat', 'interval_6h'), Markup.button.callback('12 soat', 'interval_12h')],
          [Markup.button.callback('Kunlik', 'interval_24h')]
        ])
      );
    } catch (err) {
      console.error('Video saqlash xato:', err);
      ctx.reply('❌ Videoni saqlashda xatolik yuz berdi.');
    }
  });

  bot.action(/interval_(.+)/, async (ctx) => {
    const code = ctx.match[1];
    const telegramId = ctx.from.id;
    const intervalMs = parseIntervalToMs(code);

    if (!intervalMs) return ctx.answerCbQuery('Noto\'g\'ri interval');

    const pending = await PendingVideo.findOne({ telegramId }).sort({ createdAt: -1 });
    if (!pending) {
      await ctx.answerCbQuery();
      return ctx.reply('❗ Avval video yuboring.');
    }

    await ScheduledPost.create({
      telegramId,
      videoUrl: pending.videoUrl,
      intervalMs,
      nextRun: new Date() // birinchi marta darhol joylanadi, keyin interval bo'yicha
    });

    await PendingVideo.deleteOne({ _id: pending._id });

    await ctx.answerCbQuery();
    await ctx.editMessageText(`✅ Video har ${intervalLabel(code)} da avtomatik joylanadi.`);
  });

  bot.command('list', async (ctx) => {
    const telegramId = ctx.from.id;
    const posts = await ScheduledPost.find({ telegramId, active: true });

    if (posts.length === 0) return ctx.reply('Rejalashtirilgan postlar yo\'q.');

    const lines = posts.map(
      (p, i) =>
        `${i + 1}. Keyingi joylash: ${p.nextRun.toLocaleString('uz-UZ')}\n   Status: ${p.lastStatus}`
    );
    ctx.reply(lines.join('\n\n'));
  });

  bot.command('stop', async (ctx) => {
    const telegramId = ctx.from.id;
    await ScheduledPost.updateMany({ telegramId }, { active: false });
    ctx.reply('🛑 Barcha rejalashtirilgan postlar to\'xtatildi.');
  });
}

module.exports = registerHandlers;
