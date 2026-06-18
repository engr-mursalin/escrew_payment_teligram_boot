module.exports = (userService) => async (ctx, next) => {
  if (!ctx.from) return next();
  const user = await userService.ensureTelegramUser(ctx.from);
  if (user.isBanned) {
    await ctx.reply('Your account is banned. Contact support.');
    return null;
  }
  ctx.state.user = user;
  return next();
};
