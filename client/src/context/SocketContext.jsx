import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only connect if user is logged in
    const userRole = localStorage.getItem("role");
    const userString = localStorage.getItem("user");
    
    // We strictly want this for students to receive notifications in real-time
    // But club heads can also connect if we want them to receive things later.
    if (userString && userString !== "undefined") {
      const user = JSON.parse(userString);
      
      const newSocket = io(API_URL.replace("/api", ""));

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to socket server");
        // Join their personal room
        newSocket.emit("join", user._id || user.id);
      });

      newSocket.on("new-notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      if (["member", "club", "facultyCoordinator"].includes(userRole)) {
        axios.get(`${API_URL}/api/notifications`)
          .then(res => {
            setNotifications(res.data);
            const unread = res.data.filter(n => !(n.readBy || []).includes(user._id || user.id)).length;
            setUnreadCount(unread);
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
