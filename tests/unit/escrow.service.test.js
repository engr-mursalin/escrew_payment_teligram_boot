const EscrowService = require('../../src/services/escrow.service');
const escrowStatus = require('../../src/constants/escrowStatus');

describe('EscrowService', () => {
  test('creates escrow with fee snapshot', async () => {
    const escrowRepository = {
      create: jest.fn(async (p) => ({ ...p, _id: 'x' })),
    };
    const service = new EscrowService({
      escrowRepository,
      paymentService: {},
      transactionRepository: {},
      auditLogRepository: {},
    });

    const escrow = await service.createEscrow({
      buyerId: 'buyer',
      title: 'Test',
      description: '',
      type: 'goods',
      amount: '100',
      currency: 'USDT_TRC20',
      deadline: new Date(),
      sellerTelegramId: 123,
    });

    expect(escrow.escrowId).toMatch(/^ESC-/);
    expect(escrow.status).toBeUndefined(); // status is added by DB defaults, repo returns payload in this test
    expect(escrow.feePercent).toBeDefined();
  });

  test('confirmFunding requires PENDING_PAYMENT -> FUNDED transition', async () => {
    const escrow = { _id: '1', escrowId: 'ESC-2026-00001', status: escrowStatus.PENDING_PAYMENT, depositAddress: 'addr', amount: '10', currency: 'BTC' };
    const escrowRepository = {
      findByEscrowId: jest.fn(async () => escrow),
      updateById: jest.fn(async (_id, patch) => ({ ...escrow, ...patch })),
    };
    const transactionRepository = { create: jest.fn(async () => ({})) };
    const service = new EscrowService({
      escrowRepository,
      paymentService: {},
      transactionRepository,
      auditLogRepository: {},
    });

    const updated = await service.confirmFunding({ escrowId: escrow.escrowId, txHash: 'tx', confirmations: 3 });
    expect(updated.status).toBe(escrowStatus.FUNDED);
  });
});

