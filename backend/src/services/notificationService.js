import twilio from 'twilio';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Notification } from '../models/Notification.js';

let twilioClient = null;
function getTwilioClient() {
  if (!env.twilio.accountSid || !env.twilio.authToken) return null;
  if (!twilioClient) twilioClient = twilio(env.twilio.accountSid, env.twilio.authToken);
  return twilioClient;
}

export async function sendSms(toNumber, body) {
  const client = getTwilioClient();
  if (!client) {
    logger.info(`[SMS stub — set TWILIO_* in .env to send for real] To ${toNumber}: ${body}`);
    return { sent: false, stub: true };
  }
  const message = await client.messages.create({ to: toNumber, from: env.twilio.fromNumber, body });
  return { sent: true, sid: message.sid };
}

export async function sendWhatsapp(toNumber, body) {
  const client = getTwilioClient();
  if (!client) {
    logger.info(`[WhatsApp stub — set TWILIO_* in .env to send for real] To ${toNumber}: ${body}`);
    return { sent: false, stub: true };
  }
  const message = await client.messages.create({
    to: `whatsapp:${toNumber}`,
    from: env.twilio.whatsappFrom,
    body,
  });
  return { sent: true, sid: message.sid };
}

// Firebase Cloud Messaging push — wire up firebase-admin once FCM_* creds are set.
export async function sendPush(userId, { title, body, data }) {
  logger.info(`[FCM stub — set FCM_* in .env to send for real] To user ${userId}: ${title} — ${body}`);
  return { sent: false, stub: true };
}

// Always persists an in-app notification; pushes SMS/WhatsApp/FCM best-effort alongside it.
export async function notifyUser(userId, { title, body, type = 'system', data = {}, channels = ['in_app'] }) {
  const notification = await Notification.create({ user: userId, title, body, type, data });

  if (channels.includes('push')) {
    await sendPush(userId, { title, body, data }).catch((err) => logger.error(`Push failed: ${err.message}`));
  }

  return notification;
}
