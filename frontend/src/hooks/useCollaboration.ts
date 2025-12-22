import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { useAuth } from '../contexts/AuthContext';

interface CursorPosition {
  x: number;
  y: number;
}

interface RemoteUser {
  socketId: string;
  userId: string;
  userName: string;
  color: string;
  cursor?: CursorPosition;
}

interface UseCollaborationOptions {
  diagramId: string | null;
  onYjsUpdate?: (update: Uint8Array) => void;
}

export function useCollaboration({ diagramId, onYjsUpdate }: UseCollaborationOptions) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<RemoteUser[]>([]);
  const [myColor, setMyColor] = useState<string>('#1168bd');
  const yjsDocRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io('http://localhost:3000/collaboration', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user]);

  useEffect(() => {
    if (!socket || !diagramId || !user) return;

    socket.emit('join-diagram', {
      diagramId,
      user: {
        id: user.id,
        name: user.name,
      },
    });

    socket.on('room-joined', (data: { diagramId: string; activeUsers: RemoteUser[]; yourColor: string }) => {
      console.log('Joined room:', data);
      setActiveUsers(data.activeUsers);
      setMyColor(data.yourColor);
    });

    socket.on('user-joined', (data: RemoteUser) => {
      console.log('User joined:', data);
      setActiveUsers((prev) => [...prev, data]);
    });

    socket.on('user-left', (data: { socketId: string }) => {
      console.log('User left:', data);
      setActiveUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
    });

    socket.on('cursor-update', (data: { socketId: string; cursor: CursorPosition }) => {
      setActiveUsers((prev) =>
        prev.map((u) =>
          u.socketId === data.socketId ? { ...u, cursor: data.cursor } : u
        )
      );
    });

    socket.on('yjs-update', (data: { update: Uint8Array; from: string }) => {
      if (onYjsUpdate) {
        onYjsUpdate(data.update);
      }
    });

    return () => {
      socket.emit('leave-diagram', { diagramId });
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('cursor-update');
      socket.off('yjs-update');
    };
  }, [socket, diagramId, user, onYjsUpdate]);

  const sendCursorPosition = useCallback(
    (cursor: CursorPosition) => {
      if (socket && diagramId) {
        socket.emit('cursor-move', { diagramId, cursor });
      }
    },
    [socket, diagramId]
  );

  const sendYjsUpdate = useCallback(
    (update: Uint8Array) => {
      if (socket && diagramId) {
        socket.emit('yjs-update', { diagramId, update });
      }
    },
    [socket, diagramId]
  );

  const initYjsDoc = useCallback(() => {
    if (!yjsDocRef.current) {
      yjsDocRef.current = new Y.Doc();
    }
    return yjsDocRef.current;
  }, []);

  return {
    socket,
    isConnected,
    activeUsers,
    myColor,
    sendCursorPosition,
    sendYjsUpdate,
    initYjsDoc,
    yjsDoc: yjsDocRef.current,
  };
}
