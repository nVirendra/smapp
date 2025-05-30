import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from '../hooks/useAuth';
export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [_, setReady] = useState(false); // to force re-render

  useEffect(() => {
    if (user?.id && !socketRef.current) {
      console.log('🔌 Connecting socket for', user.id);
      const socketInstance = io('http://localhost:5000', {
        query: { userId: user.id },
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current = socketInstance;

      setReady(true); // trigger re-render after socket is ready

      return () => {
        socketInstance.disconnect();
        socketRef.current = null;
        setReady(false);
      };
    }
  }, [user]);

  return socketRef.current;
};
