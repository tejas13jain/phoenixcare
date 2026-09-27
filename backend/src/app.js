import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { swaggerSpec } from './docs/swagger.js';
import apiRoutes from './routes/index.js';
import { handleWebhook } from './controllers/paymentController.js';
import { apiLimiter } from './middlewares/rateLimiters.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [env.clientUrl, env.adminUrl],
      credentials: true,
    })
  );
  app.use(compression());
  app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

  // Razorpay webhook needs the raw request body to verify its HMAC signature —
  // must be registered before the global express.json() body parser below.
  app.post('/api/v1/payments/webhook', express.raw({ type: '*/*' }), handleWebhook);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());

  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/v1', apiLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
