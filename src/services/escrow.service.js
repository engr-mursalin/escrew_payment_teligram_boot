const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const escrowStatus = require('../constants/escrowStatus');
const { generateEscrowId } = require('../utils/escrowId.util');
const { createInviteToken } = require('../utils/inviteToken.util');
const { calculateFee } = require('../utils/fee.util');
const { ConflictError, NotFoundError, StateMachineError } = require('../utils/errors.util');

const VALID_TRANSITIONS = {
  [escrowStatus.PENDING_SELLER]: [escrowStatus.PENDING_PAYMENT, escrowStatus.CANCELLED],
  [escrowStatus.PENDING_PAYMENT]: [escrowStatus.FUNDED, escrowStatus.EXPIRED],
  [escrowStatus.FUNDED]: [escrowStatus.RELEASED, escrowStatus.DISPUTED, escrowStatus.REFUNDED],
  [escrowStatus.DISPUTED]: [escrowStatus.RELEASED, escrowStatus.REFUNDED],
};

class EscrowService {
  constructor({
    escrowRepository,
    paymentService,
    transactionRepository,
    auditLogRepository,
  }) {
    this.escrowRepository = escrowRepository;
    this.paymentService = paymentService;
    this.transactionRepository = transactionRepository;
    this.auditLogRepository = auditLogRepository;
  }

  assertTransition(current, next) {
    if (!VALID_TRANSITIONS[current] || !VALID_TRANSITIONS[current].includes(next)) {
      throw new StateMachineError(`Invalid transition ${current} -> ${next}`);
    }
  }

  async createEscrow({ buyerId, title, description, type, amount, currency, deadline, sellerTelegramId, milestones = [] }) {
    const escrowId = generateEscrowId();
    const inviteToken = createInviteToken({
      escrowId,
      sellerTelegramId,
      secret: config.inviteJwtSecret,
    });
    const inviteExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const fee = calculateFee(amount, config.platformFeePercent);
    const normalizedMilestones = milestones.slice(0, 3).map((m) => ({
      milestoneId: uuidv4(),
      title: m.title,
      amount: m.amount,
      dueDate: m.dueDate,
    }));

    return this.escrowRepository.create({
      escrowId,
      buyerId,
      title,
      description,
      type,
      amount,
      currency,
      feePercent: config.platformFeePercent,
      feeAmount: fee.feeAmount,
      netAmount: fee.netAmount,
      inviteToken,
      inviteExpiresAt,
      deadline,
      milestones: normalizedMilestones,
    });
  }

  async acceptInvite({ escrowId, sellerId }) {
    const escrow = await this.escrowRepository.findByEscrowId(escrowId);
    if (!escrow) throw new NotFoundError('Escrow not found');
    this.assertTransition(escrow.status, escrowStatus.PENDING_PAYMENT);

    const depositAddress = this.paymentService.generateDepositAddress(escrow.currency, escrow.escrowId);
    return this.escrowRepository.updateById(escrow._id, {
      sellerId,
      status: escrowStatus.PENDING_PAYMENT,
      depositAddress,
    });
  }

  async confirmFunding({ escrowId, txHash, confirmations = 3 }) {
    const escrow = await this.escrowRepository.findByEscrowId(escrowId);
    if (!escrow) throw new NotFoundError('Escrow not found');
    this.assertTransition(escrow.status, escrowStatus.FUNDED);
    if (confirmations < 3) throw new ConflictError('Not enough confirmations');

    const updated = await this.escrowRepository.updateById(escrow._id, {
      status: escrowStatus.FUNDED,
      depositTxHash: txHash,
      fundedAt: new Date(),
    });

    await this.transactionRepository.create({
      escrowId: escrow._id,
      type: 'deposit',
      fromAddress: 'buyer_wallet',
      toAddress: escrow.depositAddress,
      amount: escrow.amount,
      currency: escrow.currency,
      txHash,
      blockConfirmations: confirmations,
      status: 'confirmed',
    });

    return updated;
  }

  async release({ escrowId, sellerWalletAddress }) {
    const escrow = await this.escrowRepository.findByEscrowId(escrowId);
    if (!escrow) throw new NotFoundError('Escrow not found');
    this.assertTransition(escrow.status, escrowStatus.RELEASED);

    const payout = await this.paymentService.releaseToSeller({ escrow, sellerWalletAddress });
    const updated = await this.escrowRepository.updateById(escrow._id, {
      status: escrowStatus.RELEASED,
      releasedAt: new Date(),
      releaseTxHash: payout.txHash,
    });

    await this.transactionRepository.create({
      escrowId: escrow._id,
      type: 'release',
      fromAddress: escrow.depositAddress || 'escrow_wallet',
      toAddress: sellerWalletAddress,
      amount: escrow.netAmount,
      currency: escrow.currency,
      txHash: payout.txHash,
      status: 'confirmed',
    });

    return updated;
  }
}

module.exports = EscrowService;
