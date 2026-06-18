const User = require('../models/User.model');

class UserRepository {
  async upsertTelegramUser(telegramUser) {
    return User.findOneAndUpdate(
      { telegramId: telegramUser.id },
      {
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name || 'Unknown',
        lastName: telegramUser.last_name,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async findByTelegramId(telegramId) {
    return User.findOne({ telegramId });
  }

  async findById(id) {
    return User.findById(id);
  }

  async list({ page = 1, limit = 20, search = '' }) {
    const query = search ? { username: new RegExp(search, 'i') } : {};
    return User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }
}

module.exports = UserRepository;
