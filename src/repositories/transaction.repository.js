const Transaction = require('../models/Transaction.model');

class TransactionRepository {
  async create(payload) {
    return Transaction.create(payload);
  }

  async findByExternalPaymentId(externalPaymentId) {
    return Transaction.findOne({ externalPaymentId });
  }
}

module.exports = TransactionRepository;
