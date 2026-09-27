import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    // Fail fast with a real error instead of hanging until the host's own port-scan
    // timeout kills the process (which is what happens on Render when Atlas silently
    // drops connections — e.g. Network Access not yet allowing the host's IP).
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
}
