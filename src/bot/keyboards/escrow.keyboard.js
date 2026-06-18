const { Markup } = require('telegraf');

const escrowActionsKeyboard = (escrowId) => Markup.inlineKeyboard([
  [Markup.button.callback('Approve', `approve:${escrowId}`)],
  [Markup.button.callback('Dispute', `dispute:${escrowId}`)],
]);

module.exports = { escrowActionsKeyboard };
