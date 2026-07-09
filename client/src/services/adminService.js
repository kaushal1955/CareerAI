import api, { buildAuthConfig } from './api';

export async function getAdminDashboard(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/admin/dashboard', config);
  return data;
}

export async function getAdminUsers(getToken, params = {}) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/admin/users', {
    ...config,
    params,
  });
  return data;
}

export async function updateAdminUserStatus(getToken, userId, status) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.patch(`/admin/users/${userId}/status`, { status }, config);
  return data;
}

export async function updateAdminUserRole(getToken, userId, role) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.patch(`/users/${userId}/role`, { role }, config);
  return data;
}

export async function assignStudentToMentor(getToken, mentorId, studentId) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post(`/admin/mentors/${mentorId}/assign-student`, { studentId }, config);
  return data;
}

export async function unassignStudentFromMentor(getToken, mentorId, studentId) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.delete(`/admin/mentors/${mentorId}/assign-student/${studentId}`, config);
  return data;
}

export async function getAdminReports(getToken, params = {}) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/reports/admin', {
    ...config,
    params,
  });
  return data;
}

export async function updateAdminReport(getToken, reportId, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.patch(`/reports/admin/${reportId}`, payload, config);
  return data;
}

export async function getAdminResources(getToken, params = {}) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/admin/resources', {
    ...config,
    params,
  });
  return data;
}

export async function moderateAdminResource(getToken, resourceId, payload) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.patch(`/admin/resources/${resourceId}/moderate`, payload, config);
  return data;
}
