const { welcomeText } = require('../../utils/messages.template');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    await ctx.reply(welcomeText());
  });
};
