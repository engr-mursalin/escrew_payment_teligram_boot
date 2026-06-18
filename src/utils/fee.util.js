const BigNumber = require('bignumber.js');

const calculateFee = (amount, feePercent) => {
  const safeAmount = new BigNumber(amount);
  const safePercent = new BigNumber(feePercent);
  const feeAmount = safeAmount.multipliedBy(safePercent).dividedBy(100);
  const netAmount = safeAmount.minus(feeAmount);

  return {
    feeAmount: feeAmount.toFixed(),
    netAmount: netAmount.toFixed(),
  };
};

module.exports = { calculateFee };
