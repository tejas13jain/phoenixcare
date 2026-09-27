import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational || statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details,
    stack: env.isProd ? undefined : err.stack,
  });
}
