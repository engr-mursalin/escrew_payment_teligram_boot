const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, unique: true, immutable: true, index: true },
    username: { type: String, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user', index: true },
    walletAddress: { type: String },
    preferredCurrency: {
      type: String,
      enum: ['USDT_TRC20', 'USDT_ERC20', 'BTC'],
      default: 'USDT_TRC20',
    },
    totalDealsAsBuyer: { type: Number, default: 0 },
    totalDealsAsSeller: { type: Number, default: 0 },
    totalVolume: { type: mongoose.Schema.Types.Decimal128, default: 0 },
    isBanned: { type: Boolean, default: false, index: true },
    banReason: { type: String },
    language: { type: String, enum: ['bn', 'en'], default: 'bn' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
