import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationPopup from '../components/NotificationPopup';
import InAppNotificationToast from '../components/InAppNotificationToast';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [realtimeToast, setRealtimeToast] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    setNotification({ message, type, duration });
  }, []);

  const showRealtimeToast = useCallback((toastData) => {
    setRealtimeToast(toastData);
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const closeRealtimeToast = useCallback(() => {
    setRealtimeToast(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, showRealtimeToast }}>
      {children}
      {notification && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={closeNotification}
        />
      )}
      {realtimeToast && (
        <InAppNotificationToast
          toast={realtimeToast}
          onClose={closeRealtimeToast}
        />
      )}
    </NotificationContext.Provider>
  );
};
