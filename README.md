# escrew_payment_teligram_boot

Escrow payment system for Telegram — buyer and seller manage payments with secure escrow flow.

Node.js + Express + MongoDB Telegram escrow bot (Telegraf).

## Setup

1. Install deps
   - `npm install`
2. Create `.env`
   - Copy `.env.example` to `.env` and fill `BOT_TOKEN` + `MONGODB_URI`
3. Run
   - `npm run dev`

## Bot Commands (minimal baseline)

- `/start`
- `/create`
- `/buyer`, `/seller`
- `/balance`, `/pay_seller`, `/refund_buyer`
- `/network auto|usdt_trc20|usdt_erc20|usdt_bep20|eth|btc|ltc`
- `/force_release`, `/force_refund` (admin only)

## Webhooks

- NOWPayments callback: `POST /api/webhooks/nowpayments`

This repo is a baseline scaffold; replace `PaymentService` placeholder methods with NOWPayments address creation + payout when you're ready.
