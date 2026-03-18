import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import api from "../../api/api";
import { useSocket } from "../../context/SocketContext";

const MessageIcon = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const queryClient = useQueryClient();
  const prevLocationRef = useRef(location.pathname);

  // Fetch unread count with React Query
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["messages", "unread"],
    queryFn: async () => {
      const response = await api.get("/messages/unread/count");
      if (response.data.status === "success") {
        return response.data.data.unreadCount || 0;
      }
      return 0;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: false, // Disable background polling - rely on socket events only
  });

  // Only invalidate when leaving messages pages (not every navigation)
  useEffect(() => {
    const wasOnMessages = prevLocationRef.current.startsWith("/messages");
    const isOnMessages = location.pathname.startsWith("/messages");

    // Only refetch when navigating AWAY from messages section
    if (wasOnMessages && !isOnMessages) {
      queryClient.invalidateQueries(["messages", "unread"]);
    }

    prevLocationRef.current = location.pathname;
  }, [location.pathname, queryClient]);

  // Listen for new messages to update count
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (data.type === "newMessage") {
          // Invalidate to trigger refetch
          queryClient.invalidateQueries(["messages", "unread"]);
        }
        if (data.type === "messagesSeen") {
          // Invalidate to trigger refetch
          queryClient.invalidateQueries(["messages", "unread"]);
        }
      };

      socket.on("message", handleNewMessage);

      return () => {
        socket.off("message", handleNewMessage);
      };
    }
  }, [socket, queryClient]);

  return (
    <NavLink
      to="/messages"
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 relative ${
          isActive
            ? "text-mono-white dark:text-mono-black bg-mono-black dark:bg-mono-white"
            : "text-mono-black dark:text-mono-white hover:bg-mono-200 dark:hover:bg-mono-900"
        }`
      }
      title="Messages"
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-mono-black dark:bg-mono-white text-mono-white dark:text-mono-black text-xs font-bold rounded-full px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
      <span className="hidden lg:inline font-medium">Messages</span>
    </NavLink>
  );
};

export default MessageIcon;
