import api, { buildAuthConfig } from './api';

export async function getMyProfile(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/profiles/me', config);
  return data;
}

export async function upsertMyProfile(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.put('/profiles/me', payload, config);
  return data;
}
