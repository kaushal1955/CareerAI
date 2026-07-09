import PushSubscription from '../models/PushSubscription.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPushConfiguration, sendPushToUser } from '../services/pushService.js';

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

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

const defaultPreferences = {
  inApp: true,
  email: true,
  push: false,
  chatMessage: true,
  mentorSession: true,
  mentorResource: true,
  mentorAssignment: true,
  adminUpdate: true,
  reportUpdate: true,
};

export const getNotificationSettings = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const subscriptions = await PushSubscription.find({ user: user._id })
    .sort({ createdAt: -1 })
    .select('endpoint deviceLabel userAgent createdAt lastUsedAt');

  res.status(200).json({
    success: true,
    preferences: {
      ...defaultPreferences,
      ...(user.notificationPreferences?.toObject?.() || user.notificationPreferences || {}),
    },
    push: {
      ...getPushConfiguration(),
      subscriptionCount: subscriptions.length,
      subscriptions,
    },
  });
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const nextPreferences = {
    inApp: req.body.inApp !== false,
    email: req.body.email !== false,
    push: req.body.push === true,
    chatMessage: req.body.chatMessage !== false,
    mentorSession: req.body.mentorSession !== false,
    mentorResource: req.body.mentorResource !== false,
    mentorAssignment: req.body.mentorAssignment !== false,
    adminUpdate: req.body.adminUpdate !== false,
    reportUpdate: req.body.reportUpdate !== false,
  };

  user.notificationPreferences = nextPreferences;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Notification preferences updated successfully.',
    preferences: nextPreferences,
  });
});

export const savePushSubscription = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const endpoint = cleanString(req.body.endpoint);
  const p256dh = cleanString(req.body.keys?.p256dh);
  const auth = cleanString(req.body.keys?.auth);

  if (!endpoint || !p256dh || !auth) {
    res.status(400);
    throw new Error('A valid push subscription payload is required.');
  }

  const subscription = await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      user: user._id,
      endpoint,
      expirationTime: req.body.expirationTime ?? null,
      keys: { p256dh, auth },
      userAgent: cleanString(req.headers['user-agent']),
      deviceLabel: cleanString(req.body.deviceLabel),
      lastUsedAt: new Date(),
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  if (user.notificationPreferences?.push !== true) {
    user.notificationPreferences = {
      ...(user.notificationPreferences?.toObject?.() || user.notificationPreferences || {}),
      push: true,
    };
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Push subscription saved successfully.',
    subscription,
  });
});

export const deletePushSubscription = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const endpoint = cleanString(req.body.endpoint);

  if (!endpoint) {
    res.status(400);
    throw new Error('endpoint is required to remove a push subscription.');
  }

  await PushSubscription.deleteOne({
    user: user._id,
    endpoint,
  });

  res.status(200).json({
    success: true,
    message: 'Push subscription removed successfully.',
  });
});

export const sendTestPush = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const result = await sendPushToUser(user._id, {
    title: 'CareerAI test notification',
    body: 'Push notifications are active on this device.',
    link: '/notifications',
    metadata: { type: 'test' },
  });

  res.status(200).json({
    success: true,
    message: result.skipped
      ? 'Push delivery skipped because web-push is not configured or no active subscription was found.'
      : `Push test sent to ${result.delivered} subscription(s).`,
    result,
  });
});
