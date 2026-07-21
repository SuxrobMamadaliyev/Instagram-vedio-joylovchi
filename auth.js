const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const IgAccount = require('./IgAccount');
const { exchangeToken, getIgBusinessAccount } = require('./instagram');

const { FB_APP_ID, FB_APP_SECRET, REDIRECT_URI } = process.env;

// Foydalanuvchini Facebook login sahifasiga yo'naltirish
router.get('/instagram', (req, res) => {
  const { telegramId } = req.query;
  if (!telegramId) return res.status(400).send('telegramId kerak');

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${telegramId}` +
    `&scope=instagram_basic,instagram_content_publish,pages_show_list`;

  res.redirect(url);
});

// Facebook qaytargan callback
router.get('/callback', async (req, res) => {
  const { code, state: telegramId } = req.query;
  if (!code) return res.status(400).send('Kod topilmadi');

  try {
    // 1. Code -> short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&client_secret=${FB_APP_SECRET}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // 2. Short-lived -> long-lived token
    const longToken = await exchangeToken(tokenData.access_token, FB_APP_ID, FB_APP_SECRET);

    // 3. Instagram Business akkauntni topish
    const { igUserId, pageId } = await getIgBusinessAccount(longToken);

    // 4. Saqlash
    await IgAccount.findOneAndUpdate(
      { telegramId },
      { telegramId, accessToken: longToken, igUserId, pageId },
      { upsert: true, new: true }
    );

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding-top:50px">
        <h2>✅ Instagram akkaunt muvaffaqiyatli ulandi!</h2>
        <p>Botga qaytib, video yuborishingiz mumkin.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('Auth callback xato:', err.message);
    res.status(500).send(`❌ Xatolik: ${err.message}`);
  }
});

module.exports = router;
