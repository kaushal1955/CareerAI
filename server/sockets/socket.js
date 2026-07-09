import { Server } from 'socket.io';

let io;
const connectedUsers = new Map();

export function initSocketServer(httpServer) {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    socket.on('register', ({ userId }) => {
      if (!userId) return;
      const normalized = String(userId);
      socket.data.userId = normalized;
      socket.join(`user:${normalized}`);
      const sockets = connectedUsers.get(normalized) || new Set();
      sockets.add(socket.id);
      connectedUsers.set(normalized, sockets);
    });

    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (!userId) return;
      const sockets = connectedUsers.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (!sockets.size) {
        connectedUsers.delete(userId);
      }
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}

export function emitToUser(userId, eventName, payload) {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit(eventName, payload);
}
