import webpush from 'web-push';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { PushSubscription } from '../models/PushSubscription.js';

let configured = false;
function ensureConfigured() {
  if (!env.webPush.publicKey || !env.webPush.privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(env.webPush.contactEmail, env.webPush.publicKey, env.webPush.privateKey);
    configured = true;
  }
  return true;
}

export async function saveSubscription(userId, subscription, userAgent) {
  return PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { user: userId, endpoint: subscription.endpoint, keys: subscription.keys, userAgent },
    { upsert: true, new: true }
  );
}

export async function removeSubscription(endpoint) {
  await PushSubscription.deleteOne({ endpoint });
}

export async function sendPushToUser(userId, { title, body, url }) {
  if (!ensureConfigured()) {
    logger.info(`[Web Push stub — set VAPID_* in .env to send for real] To user ${userId}: ${title} — ${body}`);
    return { sent: false, stub: true };
  }

  const subscriptions = await PushSubscription.find({ user: userId });
  const payload = JSON.stringify({ title, body, url: url || '/' });

  await Promise.all(
    subscriptions.map((sub) =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)
        .catch(async (err) => {
          // 410 Gone / 404 Not Found — the browser unsubscribed; stop trying that endpoint.
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            logger.error(`Web push failed for ${sub.endpoint}: ${err.message}`);
          }
        })
    )
  );

  return { sent: subscriptions.length > 0, recipientCount: subscriptions.length };
}
