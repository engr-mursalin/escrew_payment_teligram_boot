const express = require('express');

module.exports = (webhookController) => {
  const router = express.Router();
  router.post('/nowpayments', (req, res) => webhookController.nowPayments(req, res));
  return router;
};

