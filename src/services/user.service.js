class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async ensureTelegramUser(telegramUser) {
    return this.userRepository.upsertTelegramUser(telegramUser);
  }

  async getByTelegramId(telegramId) {
    return this.userRepository.findByTelegramId(telegramId);
  }
}

module.exports = UserService;
