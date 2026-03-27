import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const [unreadCount, setUnreadCount] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && !socketRef.current) {
      // const socketInstance = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });
      const socketInstance = io("http://localhost:3000", {
        withCredentials: true,
      });

      socketInstance.on("connect", () => {
        // console.log("Socket connected:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        // console.log("Socket disconnected");
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);
    }

    return () => {};
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && user?._id) {
      socket.emit("user-connected", user._id);
    }
  }, [socket, user?._id]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => (prev ?? 0) + 1);
    };

    socket.on("new-notification", handleNotification);

    return () => {
      socket.off("new-notification", handleNotification);
    };
  }, [socket]);

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
