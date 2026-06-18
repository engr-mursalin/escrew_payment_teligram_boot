module.exports = (bot) => {
  bot.on('callback_query', async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch (e) {
      // Ignore callback query races; dedicated handlers respond when needed.
    }
  });
};
