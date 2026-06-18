const logger = require('../config/logger');

class NotificationService {
  constructor({ bot }) {
    this.bot = bot;
  }

  async sendMessage(chatId, text) {
    if (!this.bot) return;
    try {
      await this.bot.telegram.sendMessage(chatId, text);
    } catch (error) {
      logger.warn(`Failed sending telegram message: ${error.message}`);
    }
  }
}

module.exports = NotificationService;
