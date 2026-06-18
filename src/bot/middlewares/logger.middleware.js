const logger = require('../../config/logger');

module.exports = async (ctx, next) => {
  if (ctx.message?.text) {
    logger.info(`telegram:${ctx.from?.id || 'unknown'} => ${ctx.message.text}`);
  }
  return next();
};
