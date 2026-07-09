import api, { buildAuthConfig } from './api';

export async function getNotificationSettings(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/settings/notifications', config);
  return data;
}

export async function updateNotificationSettings(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.put('/settings/notifications', payload, config);
  return data;
}

export async function savePushSubscription(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/settings/push-subscriptions', payload, config);
  return data;
}

export async function deletePushSubscription(getToken, endpoint) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.delete('/settings/push-subscriptions', {
    ...config,
    data: { endpoint },
  });
  return data;
}

export async function sendPushTest(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/settings/push-test', {}, config);
  return data;
}
