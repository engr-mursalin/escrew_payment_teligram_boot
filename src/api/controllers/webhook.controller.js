const crypto = require('node:crypto');
const config = require('../../config');
const { PaymentError } = require('../../utils/errors.util');

class WebhookController {
  constructor({ escrowService }) {
    this.escrowService = escrowService;
  }

  verifyNowPaymentsSignature(req) {
    const signature = req.headers['x-nowpayments-sig'] || '';
    const bodyString = JSON.stringify(req.body);
    const computed = crypto.createHmac('sha512', config.nowPaymentsIpnSecret).update(bodyString).digest('hex');
    return signature === computed;
  }

  async nowPayments(req, res) {
    if (config.nowPaymentsIpnSecret && !this.verifyNowPaymentsSignature(req)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { order_id: escrowId, payment_status: status, payment_id: paymentId, payin_hash: txHash } = req.body || {};
    if (!escrowId) return res.status(400).json({ message: 'Missing order_id' });

    if (status !== 'finished' && status !== 'confirmed') {
      return res.json({ ok: true, ignored: true });
    }

    try {
      await this.escrowService.confirmFunding({ escrowId, txHash: txHash || String(paymentId), confirmations: 3 });
      return res.json({ ok: true });
    } catch (e) {
      const err = e instanceof PaymentError ? e : new PaymentError(e.message);
      return res.status(err.statusCode).json({ message: err.message });
    }
  }
}

module.exports = WebhookController;

