const cron = require('node-cron');
const escrowStatus = require('../constants/escrowStatus');

class CronService {
  constructor({ escrowRepository, escrowService }) {
    this.escrowRepository = escrowRepository;
    this.escrowService = escrowService;
    this.tasks = [];
  }

  start() {
    this.tasks.push(cron.schedule('*/15 * * * *', async () => {
      const items = await this.escrowRepository.findExpiredInvites();
      await Promise.all(items.map((i) => this.escrowRepository.updateById(i._id, { status: escrowStatus.CANCELLED })));
    }));

    this.tasks.push(cron.schedule('*/10 * * * *', async () => {
      const items = await this.escrowRepository.findPaymentTimeouts();
      await Promise.all(items.map((i) => this.escrowRepository.updateById(i._id, { status: escrowStatus.EXPIRED })));
    }));

    this.tasks.push(cron.schedule('0 * * * *', async () => {
      const items = await this.escrowRepository.findAutoRelease();
      for (const escrow of items) {
        if (escrow.sellerId) {
          await this.escrowService.release({ escrowId: escrow.escrowId, sellerWalletAddress: 'auto_release_wallet' });
        }
      }
    }));
  }
}

module.exports = CronService;
