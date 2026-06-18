const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const healthRoutes = require('./api/routes/health.routes');
const createAdminRoutes = require('./api/routes/admin.routes');
const createWebhookRoutes = require('./api/routes/webhook.routes');
const logger = require('./config/logger');
const { AppError } = require('./utils/errors.util');

const createApp = ({ controllers }) => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRoutes);
  app.use('/api/admin', createAdminRoutes(controllers.adminController));
  app.use('/api/webhooks', createWebhookRoutes(controllers.webhookController));

  // 404
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));

  // Error handler
  app.use((err, req, res, next) => {
    const e = err instanceof AppError ? err : new AppError('Internal error', 500);
    logger.error(err);
    res.status(e.statusCode).json({ message: e.message });
    next();
  });

  return app;
};

module.exports = { createApp };

