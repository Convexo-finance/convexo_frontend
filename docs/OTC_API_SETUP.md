# OTC API Setup Guide

This guide explains how to configure the OTC module for live exchange rates and order notifications.

## 🔑 Required Environment Variables

Add these to your `.env.local` file:

```bash
# Optional: Telegram Bot (for order notifications to @zktps)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Optional: Resend (for email notifications to william@convexo.xyz)
RESEND_API_KEY=your_resend_api_key_here
```

## 📧 Email Setup (Resend)

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day on free tier)
3. Get your API key from the dashboard
4. Add to `.env.local`: `RESEND_API_KEY=re_xxxxx`

**Note**: If Resend is not configured, orders will still be submitted but email notifications will be skipped.

## 💬 Telegram Setup

### Step 1: Create a Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts to create your bot
4. Copy the **Bot Token** (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Add to `.env.local`: `TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### Step 2: Get Chat ID for @zktps

**Option A: Using the Bot**
1. Have @zktps start a conversation with your bot
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":123456789}` in the response
5. Add to `.env.local`: `TELEGRAM_CHAT_ID=123456789`

**Option B: Using @userinfobot**
1. Have @zktps send `/start` to `@userinfobot`
2. The bot will respond with the chat ID
3. Add to `.env.local`: `TELEGRAM_CHAT_ID=<the_id>`

**Option C: Create a Group/Channel**
1. Create a Telegram group and add your bot
2. Add @zktps to the group
3. Send a message in the group
4. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
5. Look for the group chat ID (negative number like `-123456789`)
6. Add to `.env.local`: `TELEGRAM_CHAT_ID=-123456789`

**Note**: If Telegram is not configured, orders will still be submitted but Telegram notifications will be skipped.

## 💱 Exchange Rate API

The OTC module uses **ExchangeRate-API** for live USD/COP rates:

- **Free tier**: 1,500 requests/month
- **No API key needed** for basic usage
- Updates automatically every 5 minutes
- Fallback rate (4350.50 COP) if API fails

### Alternative APIs

If you want to use a different exchange rate provider, edit:
`/app/api/exchange-rate/usdcop/route.ts`

**Alternatives**:
- [currencyapi.com](https://currencyapi.com) - 300 requests/month free
- [exchangeratesapi.io](https://exchangeratesapi.io) - 250 requests/month free
- [openexchangerates.org](https://openexchangerates.org) - 1,000 requests/month free

## 🧪 Testing

### Test Exchange Rate API

```bash
curl http://localhost:3000/api/exchange-rate/usdcop
```

Expected response:
```json
{
  "rate": 4350.50,
  "timestamp": 1703001234567,
  "source": "ExchangeRate-API"
}
```

### Test Order Submission

1. Go to `/treasury/otc` in your app
2. Connect your wallet with Convexo Passport NFT
3. Create a test order
4. Check console logs and notifications

## 📊 Order Flow

1. **User** submits order through the OTC page
2. **Frontend** calculates total with 1.5% spread
3. **API Route** (`/api/otc/create-order`) processes the order:
   - Formats order details
   - Sends to Telegram (if configured)
   - Sends to Email (if configured)
4. **william@convexo.xyz** receives email notification
5. **@zktps** receives Telegram notification
6. **User** sees success message

## 🔒 Security Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Keep bot tokens secret
- Use environment variables for all sensitive data
- Telegram bot tokens should be regenerated if compromised

## 🚀 Deployment (Vercel)

When deploying to Vercel:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add all required variables:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `RESEND_API_KEY`
4. Redeploy your application

## 📞 Support

If orders are not being received:

1. Check console logs for errors
2. Verify environment variables are set correctly
3. Test APIs independently using curl
4. Contact william@convexo.xyz directly as fallback

## 🎯 Features

- ✅ Real-time USD/COP exchange rate
- ✅ Auto-refresh every 5 minutes
- ✅ 1.5% spread calculation
- ✅ Email notifications to william@convexo.xyz
- ✅ Telegram notifications to @zktps
- ✅ Detailed order information
- ✅ Graceful fallback if notifications fail
- ✅ Multi-chain support (all supported networks)
- ✅ User email collection (optional)

---

**Last Updated**: December 26, 2025

