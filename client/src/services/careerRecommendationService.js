import api, { buildAuthConfig } from './api';

export async function getLatestCareerRecommendation(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/careers/recommendations/latest', config);
  return data;
}

export async function generateCareerRecommendation(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/careers/recommendations/generate', {}, config);
  return data;
}
