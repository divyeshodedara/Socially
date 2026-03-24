import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket server (bypasses Vite proxy, connects directly to backend)
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
        withCredentials: true,
      });

      socketInstance.on("connect", () => {
        // console.log("Socket connected:", socketInstance.id);
        // Register user with their ID
        socketInstance.emit("user-connected", user._id);
      });

      socketInstance.on("disconnect", () => {
        // console.log("Socket disconnected");
      });

      // Listen for new notifications
      socketInstance.on("new-notification", (notification) => {
        // console.log("new notification received:", notification);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show browser notification if permission granted
        if (Notification.permission === "granted") {
          new Notification("New Notification", {
            body: getNotificationMessage(notification),
            icon: notification.sender?.profilePicture || "/logo.png",
          });
        }
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case "like":
        return `${notification.sender?.username} liked your post`;
      case "comment":
        return `${notification.sender?.username} commented on your post`;
      case "follow":
        return `${notification.sender?.username} started following you`;
      default:
        return "New notification";
    }
  };

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    socket,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setNotifications,
    setUnreadCount,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
