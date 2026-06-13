import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { getConfig } from './config/env.js';
import { logger } from './utils/logger.js';

const config = getConfig();

try {
  await connectDatabase();
  app.listen(config.port, () => logger.info('AtoZKart API listening', { port: config.port }));
} catch (error) {
  logger.error('Server startup failed', { error: error.message });
  process.exit(1);
}
