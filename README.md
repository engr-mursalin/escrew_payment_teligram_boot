# Telegram Escrow Bot

Node.js + Express + MongoDB Telegram escrow bot scaffold (Telegraf).

## Setup

1. Install deps
   - `npm install`
2. Create `.env`
   - Copy `.env.example` to `.env` and fill `BOT_TOKEN` + `MONGODB_URI`
3. Run
   - `npm run dev`

## Bot Commands (minimal baseline)

- `/start`
- `/new title | type | amount | currency | sellerTelegramId | deadline(YYYY-MM-DD)`
- `/escrows`
- `/approve ESC-XXXX seller_wallet_address`

## Webhooks

- NOWPayments callback: `POST /api/webhooks/nowpayments`

This repo is a baseline scaffold; replace `PaymentService` placeholder methods with NOWPayments address creation + payout when you’re ready.

