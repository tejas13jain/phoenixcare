import { catchAsync } from '../utils/catchAsync.js';
import { saveSubscription, removeSubscription } from '../services/pushService.js';
import { env } from '../config/env.js';

export const getPublicKey = catchAsync(async (req, res) => {
  res.json({ success: true, data: { publicKey: env.webPush.publicKey || null } });
});

export const subscribe = catchAsync(async (req, res) => {
  const subscription = await saveSubscription(req.user._id, req.body.subscription, req.headers['user-agent']);
  res.status(201).json({ success: true, message: 'Subscribed to push notifications', data: { subscription } });
});

export const unsubscribe = catchAsync(async (req, res) => {
  await removeSubscription(req.body.endpoint);
  res.json({ success: true, message: 'Unsubscribed' });
});
