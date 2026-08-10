import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { setAppIconBadge, sendLocalPushNotification, requestNotificationPermission } from "../utils/pushNotifications";

const API_URL = import.meta.env.VITE_API_URL;

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync app icon badge whenever unreadCount updates
  useEffect(() => {
    setAppIconBadge(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    // Only connect if user is logged in
    const userRole = localStorage.getItem("role");
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("admin");
    const userString = storedUser || storedAdmin;
    
    if (userString && userString !== "undefined") {
      const user = JSON.parse(userString);
      
      // Request push notification permission silently if not prompted yet
      requestNotificationPermission();

      const newSocket = io(API_URL.replace("/api", ""));

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to socket server");
        // Join their personal room
        newSocket.emit("join", user._id || user.id);
      });

      newSocket.on("new-notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => {
          const updatedCount = prev + 1;
          setAppIconBadge(updatedCount);
          return updatedCount;
        });

        const isPaymentNotif = notification.type === "PAYMENT_REVIEW" || notification.title?.toLowerCase().includes("payment");
        const notificationUrl = notification.link || (
          isPaymentNotif
            ? `/my-events${notification.eventId ? `?eventId=${notification.eventId}` : ''}`
            : (notification.eventId ? `/event/${notification.eventId}` : "/notifications")
        );

        // Trigger native PWA Push Notification banner
        console.log('[Socket] new-notification received, dispatching push notification:', notification.title);
        sendLocalPushNotification(notification.title || "CampusNode", {
          body: notification.message || notification.content || "New campus update available",
          data: { url: notificationUrl },
        });
      });

      if (["member", "club", "facultyCoordinator", "admin", "student"].includes(userRole)) {
        axios.get(`${API_URL}/api/notifications`)
          .then(res => {
            setNotifications(res.data);
            const unread = res.data.filter(n => !(n.readBy || []).includes(user._id || user.id)).length;
            setUnreadCount(unread);
            setAppIconBadge(unread);
          })
          .catch(err => console.error("Could not fetch notifications", err));
      }

      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  const value = {
    socket,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
