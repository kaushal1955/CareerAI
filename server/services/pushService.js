import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

function isPushConfigured() {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

function ensurePushConfiguration() {
  if (!isPushConfigured()) {
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  return true;
}

export function getPushConfiguration() {
  return {
    enabled: isPushConfigured(),
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
  };
}

export async function sendPushToUser(userId, payload) {
  if (!ensurePushConfiguration() || !userId) {
    return { skipped: true, delivered: 0 };
  }

  const subscriptions = await PushSubscription.find({ user: userId });
  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            expirationTime: subscription.expirationTime,
            keys: subscription.keys,
          },
          JSON.stringify(payload),
        );
        delivered += 1;
        subscription.lastUsedAt = new Date();
        await subscription.save();
      } catch (error) {
        const statusCode = error?.statusCode || error?.status;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id }).catch(() => null);
        } else {
          console.error('Push notification delivery skipped:', error.message);
        }
      }
    }),
  );

  return { skipped: false, delivered };
}
