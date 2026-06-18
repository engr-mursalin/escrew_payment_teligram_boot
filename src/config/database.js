const mongoose = require('mongoose');
const logger = require('./logger');

const connectDatabase = async (mongodbUri) => {
  await mongoose.connect(mongodbUri);
  logger.info('MongoDB connected');
};

module.exports = { connectDatabase };
