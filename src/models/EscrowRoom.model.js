const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, index: true },
    username: { type: String },
    walletAddress: { type: String },
    walletType: { type: String },
  },
  { _id: false },
);

const escrowRoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, index: true },
    chatId: { type: Number, required: true, unique: true, index: true },
    chatTitle: { type: String },
    creatorTelegramId: { type: Number, required: true, index: true },
    status: { type: String, enum: ['awaiting_roles', 'awaiting_payment', 'funded', 'released', 'refunded', 'disputed'], default: 'awaiting_roles' },
    waitingRole: { type: String, enum: ['buyer', 'seller', null], default: null },
    buyer: participantSchema,
    seller: participantSchema,
    escrowAddress: { type: String },
    createMode: { type: String, enum: ['with_admins', 'bot_only'], default: 'bot_only' },
    paymentNetwork: { type: String, enum: ['auto', 'usdt_trc20', 'usdt_erc20', 'usdt_bep20', 'eth', 'btc', 'ltc'], default: 'auto' },
    depositDetected: { type: Boolean, default: false },
    lastKnownBalance: { type: String, default: '0' },
    txCount: { type: Number, default: 0 },
    lastConfirmations: { type: Number, default: 0 },
    latestTxHash: { type: String },
    amountText: { type: String },
    description: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('EscrowRoom', escrowRoomSchema);
