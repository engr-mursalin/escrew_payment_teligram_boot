const jwt = require('jsonwebtoken');
const Joi = require('joi');
const config = require('../../config');

const loginSchema = Joi.object({
  telegramId: Joi.number().required(),
});

class AdminController {
  constructor({ userRepository, escrowRepository, disputeRepository }) {
    this.userRepository = userRepository;
    this.escrowRepository = escrowRepository;
    this.disputeRepository = disputeRepository;
  }

  login(req, res) {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: 'Validation error' });

    // Minimal bootstrap login: you promote your Telegram user to admin directly in DB.
    // Production: use OTP / Telegram confirmation.
    const token = jwt.sign({ telegramId: value.telegramId, role: 'admin' }, config.adminJwtSecret, { expiresIn: '12h' });
    return res.json({ token });
  }

  async listEscrows(req, res) {
    const rows = await this.escrowRepository.listForAdmin({ status: req.query.status });
    return res.json(rows);
  }

  async listDisputes(req, res) {
    const rows = await this.disputeRepository.listOpen();
    return res.json(rows);
  }

  async listUsers(req, res) {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '');
    const rows = await this.userRepository.list({ page, limit, search });
    return res.json(rows);
  }
}

module.exports = AdminController;

