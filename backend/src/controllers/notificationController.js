import { Notification } from '../models/Notification.js';
import { catchAsync } from '../utils/catchAsync.js';

export const listMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, data: { notifications, unreadCount } });
});

export const markAsRead = catchAsync(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json({ success: true });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});
