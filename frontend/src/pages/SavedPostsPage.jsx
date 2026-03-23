import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import Post from "../components/posts/Post";
import { useSocket } from "../context/SocketContext";
import api from "../api/api";
import toast from "react-hot-toast";

const SavedPostsPage = () => {
  const { socket } = useSocket();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  // Listen for real-time saved post updates
  useEffect(() => {
    if (!socket) return;

    const handlePostSavedUpdate = ({ postId, isSaved, post }) => {
      if (isSaved && post) {
        // Add the post to saved posts if not already there
        setSavedPosts((prev) => {
          const exists = prev.some((p) => p._id === postId);
          if (!exists) {
            return [post, ...prev];
          }
          return prev;
        });
      } else if (!isSaved) {
        // Remove the post from saved posts
        setSavedPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    };

    socket.on("postSavedUpdated", handlePostSavedUpdate);

    return () => {
      socket.off("postSavedUpdated", handlePostSavedUpdate);
    };
  }, [socket]);

  const fetchSavedPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/users/me");
      if (response.data.status === "success") {
        const user = response.data.data.user;
        setSavedPosts(user.savedPosts || []);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch saved posts";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = () => {
    // Refresh saved posts when a post is updated (e.g., unsaved)
    fetchSavedPosts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mono-black dark:border-mono-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-mono-100 dark:bg-mono-900 border border-mono-300 dark:border-mono-800 rounded-card p-6 text-center">
        <p className="text-mono-black dark:text-mono-white mb-4">{error}</p>
        <button onClick={fetchSavedPosts} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-300 dark:border-mono-800 p-4 mb-4 shadow-mono">
        <div className="flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-mono-black dark:text-mono-white" />
          <h1 className="text-2xl font-bold text-mono-black dark:text-mono-white">Saved Posts</h1>
        </div>
        <p className="text-mono-600 dark:text-mono-500 text-sm mt-1">All your saved posts in one place</p>
      </div>

      {/* Saved Posts */}
      {savedPosts.length === 0 ? (
        <div className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-300 dark:border-mono-800 p-8 text-center">
          <Bookmark className="w-16 h-16 text-mono-400 dark:text-mono-700 mx-auto mb-4" />
          <p className="text-mono-black dark:text-mono-white mb-2">No saved posts yet</p>
          <p className="text-sm text-mono-600 dark:text-mono-500">Posts you save will appear here</p>
        </div>
      ) : (
        <div className="space-y-0">
          {savedPosts.map((post) => (
            <Post key={post._id} post={post} onUpdate={handlePostUpdate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPostsPage;
