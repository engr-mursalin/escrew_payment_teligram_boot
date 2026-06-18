const Dispute = require('../models/Dispute.model');

class DisputeRepository {
  async create(payload) {
    return Dispute.create(payload);
  }

  async listOpen() {
    return Dispute.find({ status: { $in: ['open', 'under_review'] } }).sort({ createdAt: -1 });
  }

  async findById(id) {
    return Dispute.findById(id);
  }

  async updateById(id, patch) {
    return Dispute.findByIdAndUpdate(id, patch, { new: true });
  }
}

module.exports = DisputeRepository;
