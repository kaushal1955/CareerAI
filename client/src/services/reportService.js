import api, { buildAuthConfig } from './api';

export async function submitReport(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/reports', payload, config);
  return data;
}

export async function getMyReports(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/reports/me', config);
  return data;
}
