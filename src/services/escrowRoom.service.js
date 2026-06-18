const { randomBytes } = require('node:crypto');
const config = require('../config');
const { detectWalletType, generateEvmAddress } = require('../utils/wallet.util');

const roomCode = () => randomBytes(3).toString('hex').toUpperCase();
const txnId = () => `${randomBytes(3).toString('hex').toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;

class EscrowRoomService {
  constructor({ escrowRoomRepository }) {
    this.escrowRoomRepository = escrowRoomRepository;
  }

  async createRoom({ chatId, chatTitle, creatorTelegramId }) {
    return this.escrowRoomRepository.upsertByChatId(chatId, {
      roomCode: roomCode(),
      chatId,
      chatTitle,
      creatorTelegramId,
      status: 'awaiting_roles',
      waitingRole: null,
      buyer: null,
      seller: null,
      escrowAddress: null,
      depositDetected: false,
    });
  }

  async createOrResetRoom({ chatId, chatTitle, creatorTelegramId, createMode }) {
    return this.escrowRoomRepository.upsertByChatId(chatId, {
      roomCode: roomCode(),
      chatId,
      chatTitle,
      creatorTelegramId,
      createMode: createMode || 'bot_only',
      status: 'awaiting_roles',
      waitingRole: null,
      buyer: null,
      seller: null,
      escrowAddress: null,
      depositDetected: false,
      lastKnownBalance: '0',
      txCount: 0,
      lastConfirmations: 0,
      latestTxHash: null,
    });
  }

  async setWaitingRole(chatId, role) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    return this.escrowRoomRepository.updateById(room._id, { waitingRole: role });
  }

  async getByChatId(chatId) {
    return this.escrowRoomRepository.findByChatId(chatId);
  }

  async listWatchCandidates() {
    return this.escrowRoomRepository.listWatchCandidates();
  }

  async updateDescription(chatId, description) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    return this.escrowRoomRepository.updateById(room._id, { description });
  }

  async setPaymentNetwork(chatId, paymentNetwork) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    return this.escrowRoomRepository.updateById(room._id, { paymentNetwork });
  }

  async saveRoleAddress(chatId, role, user, walletAddress) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    const walletType = detectWalletType(walletAddress) || 'UNKNOWN';

    const patch = {
      waitingRole: null,
      [role]: {
        telegramId: user.id,
        username: user.username ? `@${user.username}` : user.first_name || String(user.id),
        walletAddress,
        walletType,
      },
    };

    let updated = await this.escrowRoomRepository.updateById(room._id, patch);

    if (updated.buyer?.walletAddress && updated.seller?.walletAddress && !updated.escrowAddress) {
      updated = await this.escrowRoomRepository.updateById(updated._id, {
        escrowAddress: generateEvmAddress(),
        status: 'awaiting_payment',
      });
    }

    return updated;
  }

  async markDeposit(chatId, detected = true) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    return this.escrowRoomRepository.updateById(room._id, {
      depositDetected: detected,
      status: detected ? 'funded' : room.status,
    });
  }

  async syncBalance(chatId, { balance, txCount, latestTxHash, confirmations }) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    const becameFunded = Number(txCount || 0) > Number(room.txCount || 0) || Number(balance || 0) > Number(room.lastKnownBalance || 0);
    const minConfReached = Number(confirmations || 0) >= config.minDepositConfirmations;
    const depositDetected = room.depositDetected || (becameFunded && minConfReached);
    return this.escrowRoomRepository.updateById(room._id, {
      lastKnownBalance: String(balance || room.lastKnownBalance || '0'),
      txCount: Number(txCount || room.txCount || 0),
      lastConfirmations: Number(confirmations || room.lastConfirmations || 0),
      latestTxHash: latestTxHash || room.latestTxHash,
      depositDetected,
      status: room.status === 'awaiting_payment' && depositDetected ? 'funded' : room.status,
    });
  }

  async markReleased(chatId) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    return this.escrowRoomRepository.updateById(room._id, { status: 'released' });
  }

  async markRefunded(chatId) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    return this.escrowRoomRepository.updateById(room._id, { status: 'refunded' });
  }

  async markDisputed(chatId) {
    const room = await this.escrowRoomRepository.findByChatId(chatId);
    if (!room) return null;
    return this.escrowRoomRepository.updateById(room._id, { status: 'disputed' });
  }

  generateTxnId() {
    return txnId();
  }
}

module.exports = EscrowRoomService;
