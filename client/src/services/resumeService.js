import api, { buildAuthConfig } from './api';

export async function getLatestResume(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/resumes/me/latest', config);
  return data;
}

export async function getMyResumes(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/resumes/me', config);
  return data;
}

export async function uploadResume(getToken, file, preferredCareer = '') {
  const token = await getToken();
  const formData = new FormData();
  formData.append('resume', file);
  if (preferredCareer) {
    formData.append('preferredCareer', preferredCareer);
  }

  const { data } = await api.post('/resumes/upload', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
}

export async function replaceResume(getToken, resumeId, file, preferredCareer = '') {
  const token = await getToken();
  const formData = new FormData();
  formData.append('resume', file);
  if (preferredCareer) {
    formData.append('preferredCareer', preferredCareer);
  }

  const { data } = await api.put(`/resumes/${resumeId}/replace`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
}

export async function deleteResume(getToken, resumeId) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.delete(`/resumes/${resumeId}`, config);
  return data;
}

export async function reanalyzeResume(getToken, resumeId, preferredCareer = '') {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post(`/resumes/${resumeId}/analyze`, { preferredCareer }, config);
  return data;
}

async function fetchResumeBlob(getToken, resumeId, action) {
  const config = await buildAuthConfig(getToken);
  const response = await api.get(`/resumes/${resumeId}/${action}`, {
    ...config,
    responseType: 'blob',
  });

  return response.data;
}

export async function getResumePreviewBlob(getToken, resumeId) {
  return fetchResumeBlob(getToken, resumeId, 'view');
}

export async function getResumeDownloadBlob(getToken, resumeId) {
  return fetchResumeBlob(getToken, resumeId, 'download');
}
