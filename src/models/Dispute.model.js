const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    escrowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Escrow', required: true, index: true },
    filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: ['non_delivery', 'quality', 'fraud', 'other'], required: true },
    description: { type: String, required: true, text: true },
    evidence: [{ type: String }],
    status: { type: String, enum: ['open', 'under_review', 'resolved'], default: 'open', index: true },
    resolution: { type: String, enum: ['buyer_wins', 'seller_wins', 'split'] },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminNote: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Dispute', disputeSchema);
