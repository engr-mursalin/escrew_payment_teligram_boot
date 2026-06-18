const { RateLimiterMemory } = require('rate-limiter-flexible');

const limiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
});

module.exports = async (ctx, next) => {
  if (!ctx.from) return next();
  try {
    await limiter.consume(String(ctx.from.id));
    return next();
  } catch {
    await ctx.reply('Rate limit exceeded. Try again in a minute.');
    return null;
  }
};
