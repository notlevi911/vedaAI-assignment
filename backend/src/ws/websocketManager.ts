import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export function initWebSocket(httpServer: HTTPServer): Server {
  const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigin = rawFrontendUrl.replace(/\/$/, '');

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === allowedOrigin || 
          origin === 'http://localhost:3000' || 
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join:assignment', (assignmentId: string) => {
      socket.join(assignmentId);
      console.log(`📍 Client ${socket.id} joined room: ${assignmentId}`);
    });

    socket.on('leave:assignment', (assignmentId: string) => {
      socket.leave(assignmentId);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server | null {
  return ioInstance;
}
