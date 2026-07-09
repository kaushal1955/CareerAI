import api, { buildAuthConfig } from './api';

export async function getChatContacts(getToken) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get('/chat/contacts', config);
  return data;
}

export async function getConversation(getToken, peerId) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.get(`/chat/conversations/${peerId}`, config);
  return data;
}

export async function sendChatMessage(getToken, recipientId, content) {
  const config = await buildAuthConfig(getToken);
  const { data } = await api.post('/chat/messages', { recipientId, content }, config);
  return data;
}
