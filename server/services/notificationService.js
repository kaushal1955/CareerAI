import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../sockets/socket.js';
import { sendNotificationEmail } from './emailService.js';
import { sendPushToUser } from './pushService.js';

function getPreferenceKey(type = 'system') {
  const map = {
    chat_message: 'chatMessage',
    mentor_session: 'mentorSession',
    mentor_resource: 'mentorResource',
    mentor_assignment: 'mentorAssignment',
    admin_update: 'adminUpdate',
    report_update: 'reportUpdate',
    system: null,
  };

  return map[type] ?? null;
}

function isCategoryEnabled(user, type) {
  const key = getPreferenceKey(type);
  if (!key) return true;
  return user?.notificationPreferences?.[key] !== false;
}

export async function createNotification({
  userId,
  type = 'system',
  title,
  message,
  link = '',
  metadata = {},
}) {
  if (!userId || !title || !message) {
    return null;
  }

  const user = await User.findById(userId).select(
    'firstName lastName email notificationPreferences',
  );

  if (!user || !isCategoryEnabled(user, type)) {
    return null;
  }

  let notification = null;

  if (user.notificationPreferences?.inApp !== false) {
    notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      metadata,
    });

    emitToUser(userId, 'notification:new', {
      notification,
    });
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');

  if (user.notificationPreferences?.email !== false && user.email) {
    await sendNotificationEmail({
      to: user.email,
      name,
      title,
      message,
      appPath: link,
    }).catch((error) => {
      console.error('Email notification skipped:', error.message);
    });
  }

  if (user.notificationPreferences?.push === true) {
    await sendPushToUser(userId, {
      title,
      body: message,
      link,
      metadata,
    }).catch((error) => {
      console.error('Push notification skipped:', error.message);
    });
  }

  return notification;
}

export async function createBulkNotifications(users = [], payload = {}) {
  const userIds = [...new Set((users || []).map((item) => String(item)).filter(Boolean))];
  const results = await Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        ...payload,
      }),
    ),
  );

  return results.filter(Boolean);
}
