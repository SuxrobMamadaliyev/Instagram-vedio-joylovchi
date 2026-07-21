# Instagram Autopost Telegram Bot

Telegram bot orqali Instagram Business/Creator akkauntga video (Reels) avtomatik joylash.

## Talablar

1. Instagram akkaunt **Business** yoki **Creator** turida bo'lishi kerak
2. Instagram akkaunt Facebook **Page**'ga bog'langan bo'lishi kerak
3. [Meta Developers](https://developers.facebook.com) da App yaratilgan bo'lishi kerak:
   - Mahsulot: **Facebook Login** va **Instagram Graph API** qo'shilgan
   - Ruxsatlar (permissions): `instagram_basic`, `instagram_content_publish`, `pages_show_list`
   - App Review'dan o'tgan bo'lishi kerak (production uchun), aks holda faqat test foydalanuvchilar bilan ishlaydi

## O'rnatish

```bash
npm install
cp .env.example .env
# .env faylini to'ldiring
npm start
```

## Render.com'ga deploy qilish

1. GitHub repo yarating va shu loyihani push qiling
2. Render.com > New > Web Service > repo tanlang
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables bo'limida `.env.example` dagi barcha o'zgaruvchilarni kiriting
   - `BASE_URL` va `REDIRECT_URI` ni Render bergan domenga mos qiling (masalan `https://ig-bot.onrender.com`)
6. **Muhim:** video fayllar `/uploads` papkasida saqlanadi. Render'ning bepul rejasida disk vaqtinchalik (restart bo'lganda o'chib ketadi). Ishonchli ishlash uchun **Render Disks** (persistent disk) qo'shing yoki S3/Cloudinary kabi tashqi storage'ga o'ting.

## Meta App sozlash qadamlari

1. developers.facebook.com > My Apps > Create App > "Business" turini tanlang
2. App Dashboard > Add Product > **Facebook Login** qo'shing
3. Facebook Login > Settings > Valid OAuth Redirect URIs ga qo'shing:
   `https://your-app.onrender.com/auth/callback`
4. App Dashboard > Add Product > **Instagram Graph API** qo'shing (agar kerak bo'lsa)
5. App Roles > Test Users yoki Roles bo'limida test qiluvchi hisoblarni qo'shing (App Review'gacha)
6. Production uchun App Review'ga `instagram_content_publish` ruxsatini so'rab topshiring

## Foydalanish (foydalanuvchi tomonidan)

1. `/start` — botni ishga tushirish
2. `/connect` — Instagram akkauntni ulash (havola orqali Facebook login)
3. Video yuborish — bot intervalni so'raydi (1soat/3soat/6soat/12soat/kunlik)
4. `/list` — rejalashtirilgan postlarni ko'rish
5. `/stop` — barcha postlarni to'xtatish

## Muhim cheklovlar

- Instagram Graph API 24 soatda ~25 ta post limitini qo'yadi
- Video **REELS** formatida joylanadi (oddiy feed video endi API orqali qo'llab-quvvatlanmaydi)
- `video_url` internetdan ochiq (public) bo'lishi shart — shuning uchun bot faylni serverga yuklab, public link beradi
- Long-lived token ~60 kun amal qiladi, keyin qayta `/connect` qilish kerak bo'lishi mumkin (token refresh logikasi qo'shilishi tavsiya etiladi)
