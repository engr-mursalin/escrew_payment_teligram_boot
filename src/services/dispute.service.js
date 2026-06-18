const escrowStatus = require('../constants/escrowStatus');
const { ConflictError, NotFoundError } = require('../utils/errors.util');

class DisputeService {
  constructor({ disputeRepository, escrowRepository }) {
    this.disputeRepository = disputeRepository;
    this.escrowRepository = escrowRepository;
  }

  async fileDispute({ escrowId, filedBy, against, reason, description, evidence = [] }) {
    const escrow = await this.escrowRepository.findById(escrowId);
    if (!escrow) throw new NotFoundError('Escrow not found');
    if (escrow.status !== escrowStatus.FUNDED) throw new ConflictError('Dispute can be filed only from FUNDED state');

    await this.escrowRepository.updateById(escrow._id, { status: escrowStatus.DISPUTED });
    return this.disputeRepository.create({
      escrowId: escrow._id,
      filedBy,
      against,
      reason,
      description,
      evidence,
    });
  }
}

module.exports = DisputeService;
