const { randomInt } = require('node:crypto');

const generateEscrowId = () => {
  const year = new Date().getFullYear();
  const serial = String(randomInt(0, 100000)).padStart(5, '0');
  return `ESC-${year}-${serial}`;
};

module.exports = { generateEscrowId };
