import api from "./api";

export async function registerRequest(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginRequest(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function forgotPasswordRequest(email) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPasswordRequest(token, password) {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data;
}
