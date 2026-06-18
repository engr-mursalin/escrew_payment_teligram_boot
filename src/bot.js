const { Telegraf } = require('telegraf');
const authMiddleware = require('./bot/middlewares/auth.middleware');
const rateLimitMiddleware = require('./bot/middlewares/rateLimit.middleware');
const loggerMiddleware = require('./bot/middlewares/logger.middleware');

const startHandler = require('./bot/handlers/start.handler');
const escrowHandler = require('./bot/handlers/escrow.handler');
const adminHandler = require('./bot/handlers/admin.handler');
const callbackHandler = require('./bot/handlers/callback.handler');

const createBot = ({ botToken, services }) => {
  const bot = new Telegraf(botToken);

  bot.use(loggerMiddleware);
  bot.use(rateLimitMiddleware);
  bot.use(async (ctx, next) => {
    ctx.state.services = services;
    return next();
  });
  bot.use(authMiddleware(services.userService));

  startHandler(bot);
  escrowHandler(bot, services);
  adminHandler(bot, services);
  callbackHandler(bot);

  return bot;
};

module.exports = { createBot };

