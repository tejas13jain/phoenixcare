import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/index.js';
import { startMedicationReminders } from './services/medicationReminderService.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function main() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: [env.clientUrl, env.adminUrl], credentials: true },
  });
  initSockets(io);

  httpServer.listen(env.port, () => {
    logger.info(`PhoenixCare API listening on port ${env.port} (${env.nodeEnv})`);
    logger.info(`Swagger docs: http://localhost:${env.port}/api-docs`);
  });

  startMedicationReminders();

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled rejection: ${err.message}`);
  });
}

main();
