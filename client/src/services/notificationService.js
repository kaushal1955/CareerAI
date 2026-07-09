import api, { buildAuthConfig } from './api';

export async function getMyNotifications(getToken, unreadOnly = false) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/notifications/me', {
    ...config,
    params: unreadOnly ? { unread: true } : {},
  });
  return data;
}

export async function markNotificationRead(getToken, notificationId) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.patch(`/notifications/${notificationId}/read`, {}, config);
  return data;
}

export async function markAllNotificationsRead(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.patch('/notifications/me/read-all', {}, config);
  return data;
}
