const mongoose = require('mongoose');
const escrowStatus = require('../constants/escrowStatus');

const milestoneSchema = new mongoose.Schema(
  {
    milestoneId: { type: String, required: true },
    title: { type: String, required: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    status: { type: String, enum: ['pending', 'approved', 'released'], default: 'pending' },
    dueDate: { type: Date },
    approvedAt: { type: Date },
    releasedAt: { type: Date },
    txHash: { type: String },
  },
  { _id: false },
);

const escrowSchema = new mongoose.Schema(
  {
    escrowId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['freelance', 'trade', 'goods', 'crypto_trade'], required: true, index: true },
    title: { type: String, required: true, maxlength: 200, text: true },
    description: { type: String },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    status: {
      type: String,
      enum: Object.values(escrowStatus),
      default: escrowStatus.PENDING_SELLER,
      index: true,
    },
    currency: { type: String, enum: ['USDT_TRC20', 'USDT_ERC20', 'BTC'], required: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    feePercent: { type: Number, required: true },
    feeAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
    netAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
    depositAddress: { type: String },
    depositTxHash: { type: String },
    releaseTxHash: { type: String },
    milestones: [milestoneSchema],
    inviteToken: { type: String, required: true, unique: true },
    inviteExpiresAt: { type: Date, required: true },
    deadline: { type: Date, index: true },
    fundedAt: { type: Date },
    releasedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Escrow', escrowSchema);
