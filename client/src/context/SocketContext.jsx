import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { setAppIconBadge } from "../utils/pushNotifications";
import { processNotification, normalizeNotification } from "../utils/notificationManager";
import { registerPushSubscription } from "../utils/pushSubscription";
import { useNotification } from "./NotificationContext";

const API_URL = import.meta.env.VITE_API_URL;

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { showRealtimeToast } = useNotification() || {};
  const mountTimeRef = useRef(new Date());

  // Sync app icon badge whenever unreadCount updates
  useEffect(() => {
    setAppIconBadge(unreadCount);
  }, [unreadCount]);

  // Sync notifications from backend API (Polling / Recovery)
  const syncNotifications = useCallback(async (isInitialSync = false) => {
    const userRole = localStorage.getItem("role");
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("admin");
    const userString = storedUser || storedAdmin;

    if (!userString || userString === "undefined") return;
    const user = JSON.parse(userString);
    const currentUserId = String(user._id || user.id);

    if (!["member", "club", "facultyCoordinator", "admin", "student"].includes(userRole)) return;

    try {
      const res = await axios.get(`${API_URL}/api/notifications`);
      const fetched = res.data || [];
      const normalizedList = fetched.map((n) => normalizeNotification(n)).filter(Boolean);

      setNotifications(normalizedList);

      const unread = normalizedList.filter(
        (n) => !(n.readBy || []).includes(currentUserId)
      ).length;

      setUnreadCount(unread);
      setAppIconBadge(unread);

      // Check if any genuinely NEW notification arrived during polling sync
      if (!isInitialSync) {
        normalizedList.forEach((notif) => {
          const createdAt = new Date(notif.createdAt);
          if (createdAt > mountTimeRef.current && !(notif.readBy || []).includes(currentUserId)) {
            processNotification(notif, {
              onToast: (toastData) => {
                if (showRealtimeToast) showRealtimeToast(toastData);
              },
            });
          }
        });
      }
    } catch (err) {
      console.error("[SocketContext] Could not sync notifications:", err.message);
    }
  }, [showRealtimeToast]);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("admin");
    const userString = storedUser || storedAdmin;

    if (!userString || userString === "undefined") return;
    const user = JSON.parse(userString);

    // Try registering/syncing Web Push subscription if permission is granted
    registerPushSubscription().catch(() => {});

    // Initial sync
    syncNotifications(true);

    // Socket.io connection setup
    const socketServerUrl = API_URL.replace("/api", "");
    const newSocket = io(socketServerUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    setSocket(newSocket);

    const handleConnect = () => {
      console.log("[SocketContext] Socket connected:", newSocket.id);
      // Join personal room using both string representations to ensure room match
      const primaryId = String(user.id || user._id);
      const altId = String(user._id || user.id);

      newSocket.emit("join", primaryId);
      if (altId !== primaryId) {
        newSocket.emit("join", altId);
      }

      // Re-sync state after reconnect
      syncNotifications(false);
    };

    const handleNewNotification = (rawNotif) => {
      console.log("[SocketContext] new-notification event received:", rawNotif?.title);

      const processed = processNotification(rawNotif, {
        onToast: (toastData) => {
          if (showRealtimeToast) showRealtimeToast(toastData);
        },
      });

      if (processed) {
        setNotifications((prev) => [processed, ...prev]);
        setUnreadCount((prev) => {
          const updated = prev + 1;
          setAppIconBadge(updated);
          return updated;
        });
      }
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("new-notification", handleNewNotification);

    // ── Polling & Recovery Fallbacks ──────────────────────────────────────────
    // 1. Periodic sync (every 45s)
    const interval = setInterval(() => {
      syncNotifications(false);
    }, 45000);

    // 2. Window focus & visibilitychange sync
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[SocketContext] Tab visible — triggering immediate notification sync.");
        syncNotifications(false);
      }
    };

    const handleWindowFocus = () => {
      syncNotifications(false);
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      newSocket.off("connect", handleConnect);
      newSocket.off("new-notification", handleNewNotification);
      newSocket.disconnect();
    };
  }, [syncNotifications, showRealtimeToast]);

  const value = {
    socket,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    syncNotifications,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
