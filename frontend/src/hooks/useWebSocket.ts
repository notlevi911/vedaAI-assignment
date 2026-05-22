'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '@/store/assignmentStore';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return globalSocket;
}

export function useWebSocket(assignmentId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const { updateAssignmentStatus } = useAssignmentStore();

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (assignmentId) {
      socket.emit('join:assignment', assignmentId);
    }

    const onProcessing = ({ assignmentId: id }: any) => {
      updateAssignmentStatus(id, 'processing');
    };
    const onComplete = ({ assignmentId: id, result }: any) => {
      updateAssignmentStatus(id, 'complete', result);
    };
    const onError = ({ assignmentId: id }: any) => {
      updateAssignmentStatus(id, 'error');
    };

    socket.on('job:processing', onProcessing);
    socket.on('job:complete', onComplete);
    socket.on('job:error', onError);

    return () => {
      if (assignmentId) socket.emit('leave:assignment', assignmentId);
      socket.off('job:processing', onProcessing);
      socket.off('job:complete', onComplete);
      socket.off('job:error', onError);
    };
  }, [assignmentId, updateAssignmentStatus]);

  const joinRoom = useCallback((id: string) => {
    socketRef.current?.emit('join:assignment', id);
  }, []);

  return { socket: socketRef.current, joinRoom };
}
