const EscrowRoom = require('../models/EscrowRoom.model');

class EscrowRoomRepository {
  async create(payload) {
    return EscrowRoom.create(payload);
  }

  async findByChatId(chatId) {
    return EscrowRoom.findOne({ chatId });
  }

  async findByRoomCode(roomCode) {
    return EscrowRoom.findOne({ roomCode });
  }

  async updateById(id, patch) {
    return EscrowRoom.findByIdAndUpdate(id, patch, { new: true });
  }

  async upsertByChatId(chatId, payload) {
    return EscrowRoom.findOneAndUpdate({ chatId }, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  async listWatchCandidates() {
    return EscrowRoom.find({
      status: { $in: ['awaiting_payment', 'funded'] },
      escrowAddress: { $exists: true, $ne: null },
    });
  }
}

module.exports = EscrowRoomRepository;
