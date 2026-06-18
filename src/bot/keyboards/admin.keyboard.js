const { Markup } = require('telegraf');

const adminKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Open disputes', 'admin:disputes')],
  [Markup.button.callback('Stats', 'admin:stats')],
]);

module.exports = { adminKeyboard };
