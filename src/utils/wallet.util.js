const { randomBytes } = require('node:crypto');

const ETH_RE = /^0x[a-fA-F0-9]{40}$/;
const BTC_RE = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
const LTC_RE = /^(ltc1|[LM3])[a-km-zA-HJ-NP-Z1-9]{26,62}$/;
const XMR_RE = /^[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93,105}$/;
const USDT_NET_RE = /(trc20|erc20|bep20|usdt)/i;

const detectWalletType = (text) => {
  if (!text) return null;
  const value = String(text).trim();
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)) return 'USDT_TRC20';
  if (ETH_RE.test(value)) return 'ETH_USDT_EVM';
  if (BTC_RE.test(value)) return 'BTC';
  if (LTC_RE.test(value)) return 'LTC';
  if (XMR_RE.test(value)) return 'XMR';
  if (USDT_NET_RE.test(value)) return 'USDT';
  return null;
};

const generateEvmAddress = () => `0x${randomBytes(20).toString('hex')}`;

module.exports = {
  detectWalletType,
  generateEvmAddress,
};
