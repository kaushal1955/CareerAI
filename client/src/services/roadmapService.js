import api, { buildAuthConfig } from './api';

export async function getLatestRoadmap(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/roadmaps/latest', config);
  return data;
}

export async function generateRoadmap(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/roadmaps/generate', {}, config);
  return data;
}
