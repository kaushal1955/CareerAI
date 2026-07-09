import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './sockets/socket.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    const httpServer = createServer(app);
    initSocketServer(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`CareerAI API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

bootstrap();
