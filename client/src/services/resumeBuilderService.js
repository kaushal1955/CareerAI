import api, { buildAuthConfig } from './api';

export async function getMyResumeBuilder(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/resume-builder/me', config);
  return data;
}

export async function saveMyResumeBuilder(getToken, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.put('/resume-builder/me', payload, config);
  return data;
}

export async function exportMyResumeBuilderPdf(getToken) {
  const config = await buildAuthConfig(getToken);
  const response = await api.get('/resume-builder/me/export', {
    ...config,
    responseType: 'blob',
  });
  return response.data;
}
