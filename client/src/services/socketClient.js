import { io } from 'socket.io-client';

let socketInstance = null;

function buildSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function getSocketClient() {
  if (!socketInstance) {
    socketInstance = io(buildSocketUrl(), {
      transports: ['websocket', 'polling'],
    });
  }

  return socketInstance;
}
