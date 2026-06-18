const jwt = require('jsonwebtoken');

const createInviteToken = ({ escrowId, sellerTelegramId, secret, expiresIn = '24h' }) => jwt.sign(
  { escrowId, sellerTelegramId },
  secret,
  { expiresIn },
);

const verifyInviteToken = (token, secret) => jwt.verify(token, secret);

module.exports = { createInviteToken, verifyInviteToken };
