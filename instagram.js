const fetch = require('node-fetch');

const GRAPH_VERSION = 'v19.0';
const GRAPH_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;

// Short-lived tokenni long-lived tokenga almashtirish
async function exchangeToken(shortToken, appId, appSecret) {
  const res = await fetch(
    `${GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.access_token;
}

// Foydalanuvchining Facebook Page va unga bog'liq Instagram Business akkauntini topish
async function getIgBusinessAccount(accessToken) {
  const pagesRes = await fetch(`${GRAPH_URL}/me/accounts?access_token=${accessToken}`);
  const pagesData = await pagesRes.json();
  if (pagesData.error) throw new Error(pagesData.error.message);
  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('Facebook Page topilmadi. Instagram akkauntingiz Page-ga bog\'langanligini tekshiring.');
  }

  const page = pagesData.data[0];
  const igRes = await fetch(
    `${GRAPH_URL}/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
  );
  const igData = await igRes.json();
  if (!igData.instagram_business_account) {
    throw new Error('Bu Page-ga Instagram Business akkaunt bog\'lanmagan.');
  }

  return {
    igUserId: igData.instagram_business_account.id,
    pageId: page.id,
    pageAccessToken: page.access_token
  };
}

// Video uchun media container yaratish
async function createMediaContainer(igUserId, accessToken, videoUrl, caption) {
  const res = await fetch(`${GRAPH_URL}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      media_type: 'REELS',
      video_url: videoUrl,
      caption: caption || '',
      access_token: accessToken
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.id; // creation_id
}

// Container statusini tekshirish (video processing tugaguncha kutish)
async function waitForContainerReady(creationId, accessToken, maxWaitMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(
      `${GRAPH_URL}/${creationId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') throw new Error('Instagram media processing xatosi');
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Media tayyorlanishi juda uzoq davom etdi (timeout)');
}

// Tayyor containerni publish qilish
async function publishContainer(igUserId, accessToken, creationId) {
  const res = await fetch(`${GRAPH_URL}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: creationId, access_token: accessToken })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// Yuqoridagi 3 bosqichni birlashtiruvchi asosiy funksiya
async function publishReel(igUserId, accessToken, videoUrl, caption) {
  const creationId = await createMediaContainer(igUserId, accessToken, videoUrl, caption);
  await waitForContainerReady(creationId, accessToken);
  return publishContainer(igUserId, accessToken, creationId);
}

module.exports = {
  exchangeToken,
  getIgBusinessAccount,
  publishReel
};
