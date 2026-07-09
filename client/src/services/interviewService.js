import api, { buildAuthConfig } from './api';

export async function getLatestInterview(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/interviews/latest', config);
  return data;
}

export async function generateInterview(getToken, interviewType) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/interviews/generate', { interviewType }, config);
  return data;
}

export async function evaluateInterview(getToken, interviewId, answers) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post(`/interviews/${interviewId}/evaluate`, { answers }, config);
  return data;
}
