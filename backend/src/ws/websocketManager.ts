import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export function initWebSocket(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
