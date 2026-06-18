const http = require('http');
const config = require('./config');
const logger = require('./config/logger');
const { connectDatabase } = require('./config/database');
const { createApp } = require('./app');
const { createBot } = require('./bot');

const UserRepository = require('./repositories/user.repository');
const EscrowRepository = require('./repositories/escrow.repository');
const DisputeRepository = require('./repositories/dispute.repository');
const TransactionRepository = require('./repositories/transaction.repository');
const AuditLogRepository = require('./repositories/auditLog.repository');
const EscrowRoomRepository = require('./repositories/escrowRoom.repository');

const UserService = require('./services/user.service');
const PaymentService = require('./services/payment.service');
const EscrowService = require('./services/escrow.service');
const DisputeService = require('./services/dispute.service');
const CronService = require('./services/cron.service');
const EscrowRoomService = require('./services/escrowRoom.service');

const AdminController = require('./api/controllers/admin.controller');
const WebhookController = require('./api/controllers/webhook.controller');

const bootstrap = async () => {
  await connectDatabase(config.mongodbUri);

  const repos = {
    userRepository: new UserRepository(),
    escrowRepository: new EscrowRepository(),
    disputeRepository: new DisputeRepository(),
    transactionRepository: new TransactionRepository(),
    auditLogRepository: new AuditLogRepository(),
    escrowRoomRepository: new EscrowRoomRepository(),
  };

  const paymentService = new PaymentService();

  const services = {
    userService: new UserService({ userRepository: repos.userRepository }),
    escrowService: new EscrowService({
      escrowRepository: repos.escrowRepository,
      paymentService,
      transactionRepository: repos.transactionRepository,
      auditLogRepository: repos.auditLogRepository,
    }),
    disputeService: new DisputeService({
      disputeRepository: repos.disputeRepository,
      escrowRepository: repos.escrowRepository,
    }),
    escrowRoomService: new EscrowRoomService({
      escrowRoomRepository: repos.escrowRoomRepository,
    }),
    paymentService,
    auditLogRepository: repos.auditLogRepository,
    escrowRepository: repos.escrowRepository,
    disputeRepository: repos.disputeRepository,
  };

  const controllers = {
    adminController: new AdminController(repos),
    webhookController: new WebhookController({ escrowService: services.escrowService }),
  };

  const app = createApp({ controllers });
  const server = http.createServer(app);
  server.listen(config.port, () => logger.info(`HTTP server listening on :${config.port}`));

  if (config.botToken) {
    const bot = createBot({ botToken: config.botToken, services });

    if (config.nodeEnv === 'production' && config.botWebhookUrl) {
      const secretPath = `/telegram/${config.botWebhookSecret}`;
      await bot.telegram.setWebhook(`${config.botWebhookUrl}${secretPath}`);
      app.use(secretPath, bot.webhookCallback(secretPath));
      logger.info('Telegram bot started (webhook)');
    } else {
      await bot.launch();
      logger.info('Telegram bot started (long polling)');
    }

    const cronService = new CronService({ escrowRepository: repos.escrowRepository, escrowService: services.escrowService });
    cronService.start();

    setInterval(async () => {
      try {
        const rooms = await services.escrowRoomService.listWatchCandidates();
        for (const room of rooms) {
          const walletType = room.buyer?.walletType || room.seller?.walletType || 'ETH_USDT_EVM';
          const state = await paymentService.getAddressStateForNetwork(room.escrowAddress, walletType, room.paymentNetwork || 'auto');
          const beforeTxCount = Number(room.txCount || 0);
          const updated = await services.escrowRoomService.syncBalance(room.chatId, state);
          if (updated && Number(updated.txCount || 0) > beforeTxCount) {
            await bot.telegram.sendMessage(
              room.chatId,
              `💰 New transaction detected on escrow address.\nBalance: ${updated.lastKnownBalance}\nTx count: ${updated.txCount}\nConfirmations: ${updated.lastConfirmations}/${config.minDepositConfirmations}`,
            );
          }
        }
      } catch (watchErr) {
        logger.warn(`tx watcher error: ${watchErr.message}`);
      }
    }, 90 * 1000);
  } else {
    logger.warn('BOT_TOKEN is missing; bot not started.');
  }
};

bootstrap().catch((e) => {
  logger.error(e);
  process.exit(1);
});

