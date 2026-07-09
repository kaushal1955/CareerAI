import api, { buildAuthConfig } from './api';

export async function getLatestSkillGap(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/skill-gap/latest', config);
  return data;
}

export async function generateSkillGap(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/skill-gap/generate', {}, config);
  return data;
}
