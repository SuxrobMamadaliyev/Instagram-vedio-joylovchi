const cron = require('node-cron');
const ScheduledPost = require('./ScheduledPost');
const IgAccount = require('./IgAccount');
const { publishReel } = require('./instagram');

function startScheduler(bot) {
  // Har 5 daqiqada tekshiradi
  cron.schedule('*/5 * * * *', async () => {
    const duePosts = await ScheduledPost.find({
      active: true,
      nextRun: { $lte: new Date() }
    });

    for (const post of duePosts) {
      const account = await IgAccount.findOne({ telegramId: post.telegramId });

      if (!account) {
        post.active = false;
        post.lastStatus = 'error';
        post.lastError = 'Instagram akkaunt topilmadi';
        await post.save();
        continue;
      }

      try {
        await publishReel(account.igUserId, account.accessToken, post.videoUrl, post.caption);

        post.nextRun = new Date(Date.now() + post.intervalMs);
        post.lastStatus = 'success';
        post.lastError = null;
        await post.save();

        if (bot) {
          bot.telegram.sendMessage(post.telegramId, '✅ Video Instagram\'ga muvaffaqiyatli joylandi!').catch(() => {});
        }
      } catch (err) {
        console.error(`Post ${post._id} xato:`, err.message);
        post.lastStatus = 'error';
        post.lastError = err.message;
        // Keyingi urinish uchun 15 daqiqadan keyin qayta harakat
        post.nextRun = new Date(Date.now() + 15 * 60 * 1000);
        await post.save();

        if (bot) {
          bot.telegram.sendMessage(post.telegramId, `❌ Joylashda xatolik: ${err.message}`).catch(() => {});
        }
      }
    }
  });

  console.log('⏰ Scheduler ishga tushdi (har 5 daqiqada tekshiradi)');
}

module.exports = startScheduler;
