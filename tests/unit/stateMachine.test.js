const escrowStatus = require('../../src/constants/escrowStatus');
const EscrowService = require('../../src/services/escrow.service');

describe('Escrow state machine', () => {
  test('rejects invalid transitions', () => {
    const service = new EscrowService({
      escrowRepository: {},
      paymentService: {},
      transactionRepository: {},
      auditLogRepository: {},
    });
    expect(() => service.assertTransition(escrowStatus.PENDING_SELLER, escrowStatus.RELEASED)).toThrow();
  });
});

