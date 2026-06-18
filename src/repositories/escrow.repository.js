const Escrow = require('../models/Escrow.model');

class EscrowRepository {
  async create(payload) {
    return Escrow.create(payload);
  }

  async findByEscrowId(escrowId) {
    return Escrow.findOne({ escrowId });
  }

  async findById(id) {
    return Escrow.findById(id);
  }

  async updateById(id, patch) {
    return Escrow.findByIdAndUpdate(id, patch, { new: true });
  }

  async listByUser(userId) {
    return Escrow.find({ $or: [{ buyerId: userId }, { sellerId: userId }] }).sort({ createdAt: -1 });
  }

  async listForAdmin({ status }) {
    const query = status ? { status } : {};
    return Escrow.find(query).sort({ createdAt: -1 }).populate('buyerId sellerId', 'telegramId username');
  }

  async findExpiredInvites(now = new Date()) {
    return Escrow.find({ status: 'PENDING_SELLER', inviteExpiresAt: { $lt: now } });
  }

  async findPaymentTimeouts(now = new Date()) {
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    return Escrow.find({ status: 'PENDING_PAYMENT', createdAt: { $lt: twoHoursAgo } });
  }

  async findAutoRelease(now = new Date()) {
    return Escrow.find({ status: 'FUNDED', deadline: { $lt: now } });
  }
}

module.exports = EscrowRepository;
