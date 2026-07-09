import api, { buildAuthConfig } from './api';

export async function getMentorDashboard(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/mentor/dashboard', config);
  return data;
}

export async function saveMentorProfile(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.put('/mentor/profile', payload, config);
  return data;
}

export async function createMentorSession(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/mentor/sessions', payload, config);
  return data;
}

export async function updateMentorSession(getToken, sessionId, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.patch(`/mentor/sessions/${sessionId}`, payload, config);
  return data;
}

export async function createMentorResource(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/mentor/resources', payload, config);
  return data;
}
