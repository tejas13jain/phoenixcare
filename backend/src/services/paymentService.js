import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let razorpayClient = null;
function getClient() {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) return null;
  if (!razorpayClient) razorpayClient = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return razorpayClient;
}

export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes }) {
  const client = getClient();
  if (!client) {
    logger.info(`[Razorpay stub — set RAZORPAY_* in .env to charge for real] Order for ₹${amount}, receipt ${receipt}`);
    return { id: `order_stub_${Date.now()}`, amount: amount * 100, currency, receipt, stub: true };
  }
  return client.orders.create({ amount: Math.round(amount * 100), currency, receipt, notes });
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!env.razorpay.keySecret) return true; // stub mode — accept for local/demo flows
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpay.webhookSecret) return true;
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return expected === signature;
}
