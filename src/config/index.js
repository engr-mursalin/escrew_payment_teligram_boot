const dotenv = require('dotenv');

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/telegram_escrow',
  botToken: process.env.BOT_TOKEN || '',
  botWebhookUrl: process.env.BOT_WEBHOOK_URL || '',
  botWebhookSecret: process.env.BOT_WEBHOOK_SECRET || 'change_me',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'change_me_admin',
  inviteJwtSecret: process.env.INVITE_JWT_SECRET || 'change_me_invite',
  nowPaymentsApiKey: process.env.NOWPAYMENTS_API_KEY || '',
  nowPaymentsIpnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
  bscscanApiKey: process.env.BSCSCAN_API_KEY || '',
  minDepositConfirmations: Number(process.env.MIN_DEPOSIT_CONFIRMATIONS || 3),
  adminUsernames: (process.env.ADMIN_USERNAMES || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean),
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT || 5),
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'bn',
};

module.exports = config;
