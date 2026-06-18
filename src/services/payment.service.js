const { randomUUID } = require('node:crypto');
const config = require('../config');

class PaymentService {
  generateDepositAddress(currency, escrowId) {
    const token = randomUUID().replaceAll('-', '').slice(0, 16);
    return `${currency}_${escrowId}_${token}`;
  }

  verifyWebhook(_payload) {
    return true;
  }

  async releaseToSeller({ escrow, sellerWalletAddress }) {
    const txHash = `release_${escrow.escrowId}_${Date.now()}`;
    return {
      txHash,
      to: sellerWalletAddress,
      amount: escrow.netAmount.toString(),
      currency: escrow.currency,
    };
  }

  async getAddressState(address, walletType = 'ETH_USDT_EVM') {
    return this.getAddressStateForNetwork(address, walletType, 'auto');
  }

  async getAddressStateForNetwork(address, walletType = 'ETH_USDT_EVM', network = 'auto') {
    if (network === 'usdt_trc20') return this.getUsdtTrc20State(address);
    if (network === 'usdt_erc20') return this.getUsdtErc20State(address);
    if (network === 'usdt_bep20') return this.getUsdtBep20State(address);
    if (network === 'btc') return this.getBitcoinState(address);
    if (network === 'ltc') return this.getLitecoinState(address);
    if (network === 'eth') return this.getEvmState(address);
    if (walletType === 'USDT_TRC20') return this.getUsdtTrc20State(address);
    if (walletType === 'BTC') return this.getBitcoinState(address);
    if (walletType === 'LTC') return this.getLitecoinState(address);
    return this.getEvmState(address);
  }

  async getEvmState(address) {
    const params = new URLSearchParams({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
    });
    if (config.etherscanApiKey) params.set('apikey', config.etherscanApiKey);

    const balRes = await fetch(`https://api.etherscan.io/api?${params.toString()}`);
    const balJson = await balRes.json();
    const wei = Number(balJson.result || 0);
    const balance = String(wei / 1e18);

    const txParams = new URLSearchParams({
      module: 'account',
      action: 'txlist',
      address,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '1',
      sort: 'desc',
    });
    if (config.etherscanApiKey) txParams.set('apikey', config.etherscanApiKey);

    const txRes = await fetch(`https://api.etherscan.io/api?${txParams.toString()}`);
    const txJson = await txRes.json();
    const list = Array.isArray(txJson.result) ? txJson.result : [];

    return {
      balance,
      txCount: list.length ? 1 : 0,
      latestTxHash: list[0]?.hash || null,
      confirmations: Number(list[0]?.confirmations || 0),
      explorer: `https://etherscan.io/address/${address}`,
    };
  }

  async getBitcoinState(address) {
    const res = await fetch(`https://blockchain.info/rawaddr/${address}`);
    const json = await res.json();
    return {
      balance: String((Number(json.final_balance || 0) / 1e8)),
      txCount: Number(json.n_tx || 0),
      latestTxHash: Array.isArray(json.txs) && json.txs.length ? json.txs[0].hash : null,
      confirmations: Array.isArray(json.txs) && json.txs.length ? Number(json.txs[0].block_height ? 3 : 0) : 0,
      explorer: `https://www.blockchain.com/explorer/addresses/btc/${address}`,
    };
  }

  async getLitecoinState(address) {
    const res = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);
    const json = await res.json();
    return {
      balance: String((Number(json.final_balance || 0) / 1e8)),
      txCount: Number(json.n_tx || 0),
      latestTxHash: null,
      confirmations: Number(json.n_tx || 0) > 0 ? 3 : 0,
      explorer: `https://live.blockcypher.com/ltc/address/${address}/`,
    };
  }

  async getUsdtErc20State(address) {
    const balanceParams = new URLSearchParams({
      module: 'account',
      action: 'tokenbalance',
      contractaddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      address,
      tag: 'latest',
    });
    if (config.etherscanApiKey) balanceParams.set('apikey', config.etherscanApiKey);
    const balRes = await fetch(`https://api.etherscan.io/api?${balanceParams.toString()}`);
    const balJson = await balRes.json();
    const balance = String(Number(balJson.result || 0) / 1e6);

    const txParams = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      contractaddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      address,
      page: '1',
      offset: '1',
      sort: 'desc',
    });
    if (config.etherscanApiKey) txParams.set('apikey', config.etherscanApiKey);
    const txRes = await fetch(`https://api.etherscan.io/api?${txParams.toString()}`);
    const txJson = await txRes.json();
    const list = Array.isArray(txJson.result) ? txJson.result : [];
    return {
      balance,
      txCount: list.length ? 1 : 0,
      latestTxHash: list[0]?.hash || null,
      confirmations: Number(list[0]?.confirmations || 0),
      explorer: `https://etherscan.io/address/${address}`,
    };
  }

  async getUsdtBep20State(address) {
    const balanceParams = new URLSearchParams({
      module: 'account',
      action: 'tokenbalance',
      contractaddress: '0x55d398326f99059fF775485246999027B3197955',
      address,
      tag: 'latest',
    });
    if (config.bscscanApiKey) balanceParams.set('apikey', config.bscscanApiKey);
    const balRes = await fetch(`https://api.bscscan.com/api?${balanceParams.toString()}`);
    const balJson = await balRes.json();
    const balance = String(Number(balJson.result || 0) / 1e18);

    const txParams = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      contractaddress: '0x55d398326f99059fF775485246999027B3197955',
      address,
      page: '1',
      offset: '1',
      sort: 'desc',
    });
    if (config.bscscanApiKey) txParams.set('apikey', config.bscscanApiKey);
    const txRes = await fetch(`https://api.bscscan.com/api?${txParams.toString()}`);
    const txJson = await txRes.json();
    const list = Array.isArray(txJson.result) ? txJson.result : [];
    return {
      balance,
      txCount: list.length ? 1 : 0,
      latestTxHash: list[0]?.hash || null,
      confirmations: Number(list[0]?.confirmations || 0),
      explorer: `https://bscscan.com/address/${address}`,
    };
  }

  async getUsdtTrc20State(address) {
    const balRes = await fetch(`https://apilist.tronscanapi.com/api/accountv2?address=${address}`);
    const balJson = await balRes.json();
    const tokenBalances = Array.isArray(balJson?.trc20token_balances) ? balJson.trc20token_balances : [];
    const usdt = tokenBalances.find((t) => String(t.tokenAbbr || '').toUpperCase() === 'USDT');
    const balance = usdt ? String(Number(usdt.balance || 0) / (10 ** Number(usdt.tokenDecimal || 6))) : '0';

    const txRes = await fetch(`https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=1&start=0&relatedAddress=${address}&sort=-timestamp`);
    const txJson = await txRes.json();
    const list = Array.isArray(txJson?.token_transfers) ? txJson.token_transfers : [];
    return {
      balance,
      txCount: list.length ? 1 : 0,
      latestTxHash: list[0]?.transaction_id || null,
      confirmations: list[0]?.confirmed ? config.minDepositConfirmations : 0,
      explorer: `https://tronscan.org/#/address/${address}`,
    };
  }
}

module.exports = PaymentService;
