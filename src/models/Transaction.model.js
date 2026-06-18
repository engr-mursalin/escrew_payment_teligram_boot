const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    escrowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Escrow', required: true, index: true },
    type: { type: String, enum: ['deposit', 'release', 'refund', 'fee'], required: true, index: true },
    fromAddress: { type: String, required: true },
    toAddress: { type: String, required: true },
    amount: { type: mongoose.Schema.Types.Decimal128, required: true },
    currency: { type: String, enum: ['USDT_TRC20', 'USDT_ERC20', 'BTC'], required: true },
    txHash: { type: String, unique: true, sparse: true },
    blockConfirmations: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending', index: true },
    externalPaymentId: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model('Transaction', transactionSchema);
