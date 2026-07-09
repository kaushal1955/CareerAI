import api, { buildAuthConfig } from './api';

export async function getCurrentUser(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/users/me', config);
  return data;
}
