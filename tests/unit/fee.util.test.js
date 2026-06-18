const { calculateFee } = require('../../src/utils/fee.util');

describe('calculateFee', () => {
  test('calculates fee and net', () => {
    const { feeAmount, netAmount } = calculateFee('100', 5);
    expect(feeAmount).toBe('5');
    expect(netAmount).toBe('95');
  });
});

