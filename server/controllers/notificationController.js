import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

async function findDbUser(req) {
  const userId = req.userId;

  if (!userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User record not found. Sync the authenticated user first.');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

export const getMyNotifications = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const showUnreadOnly = String(req.query.unread || '') === 'true';

  const query = {
    user: user._id,
  };

  if (showUnreadOnly) {
    query.readAt = null;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(100);

  const unreadCount = await Notification.countDocuments({
    user: user._id,
    readAt: null,
  });

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const notification = await Notification.findOne({
    _id: req.params.notificationId,
    user: user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found.');
  }

  notification.readAt = notification.readAt || new Date();
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
    notification,
  });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  await Notification.updateMany(
    {
      user: user._id,
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    },
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
