import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../lib/socket';

export const NotificationContext = createContext({
  notifications: [],
  setNotifications: () => {}, // dummy function to avoid undefined
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      console.log('📥 New notification received:', notification);
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on('new-notification', handleNotification);

    return () => {
      socket.off('new-notification', handleNotification);
    };
  }, [socket]); // 👈 crucial!

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
