module.exports = (bot, { disputeRepository }) => {
  bot.command('admin', async (ctx) => {
    if (!['admin', 'superadmin'].includes(ctx.state.user?.role)) {
      await ctx.reply('Admin only command');
      return;
    }
    const disputes = await disputeRepository.listOpen();
    await ctx.reply(`Open disputes: ${disputes.length}`);
  });
};
