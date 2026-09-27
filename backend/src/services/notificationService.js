import twilio from 'twilio';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Notification } from '../models/Notification.js';
import { sendEmail } from './emailService.js';
import { sendPushToUser } from './pushService.js';
import { getFirstName } from '../utils/formatName.js';

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

// Central fan-out: always persists an in-app notification, and best-effort delivers to
// whichever other channels are requested. Each channel degrades to a stub/log when its
// provider isn't configured (see emailService/pushService), so this never throws — a missing
// integration should never block the request that triggered the notification.
export async function notifyUser(
  userId,
  { title, body, type = 'system', data = {}, channels = ['in_app'], email, recipientName, url }
) {
  const notification = await Notification.create({ user: userId, title, body, type, data });

  if (channels.includes('email') && email) {
    await sendEmail({
      to: email,
      subject: title,
      title,
      body: `${recipientName ? `Hi ${getFirstName(recipientName)},<br/><br/>` : ''}${body}`,
      ctaUrl: env.clientUrl,
      ctaLabel: 'Open PhoenixCare',
    }).catch((err) => logger.error(`Notification email failed: ${err.message}`));
  }

  if (channels.includes('push')) {
    await sendPushToUser(userId, { title, body, url }).catch((err) => logger.error(`Push failed: ${err.message}`));
  }

  return notification;
}
