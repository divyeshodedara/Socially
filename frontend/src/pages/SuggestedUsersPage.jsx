import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import toast from "react-hot-toast";

const SuggestedUsersPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState(new Set());

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    if (user?.following) {
      setFollowingUsers(new Set(user.following));
    }
  }, [user?.following]);

  const fetchSuggestedUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users/suggested-users");
      if (response.data.status === "success") {
        setSuggestedUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await api.post(`/users/follow/${userId}`);
      if (response.data.status === "success") {
        toast.success(response.data.message || "User followed successfully");
        setFollowingUsers((prev) => new Set([...prev, userId]));

        updateUser({
          ...user,
          following: [...(user.following || []), userId],
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to follow user";
      toast.error(message);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const response = await api.post(`/users/unfollow/${userId}`);
      if (response.data.status === "success") {
        toast.success(response.data.message || "User unfollowed successfully");
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        updateUser({
          ...user,
          following: (user.following || []).filter((id) => id !== userId),
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to unfollow user";
      toast.error(message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-900 text-mono-600 dark:text-mono-400 hover:text-mono-black dark:hover:text-mono-white transition-all duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-mono-black dark:text-mono-white">Suggested for You</h1>
          <p className="text-sm text-mono-600 dark:text-mono-400 mt-1">Discover and connect with new people</p>
        </div>
        {!loading && suggestedUsers.length > 0 && (
          <button
            onClick={fetchSuggestedUsers}
            className="p-3 rounded-xl hover:bg-mono-100 dark:hover:bg-mono-900 text-mono-black dark:text-mono-white transition-all duration-300 hover:rotate-180 transform"
            title="Refresh suggestions"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Users Grid */}
      <div className="bg-mono-white dark:bg-mono-900 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-xl">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-mono-black dark:text-mono-white mx-auto mb-4" />
              <p className="text-mono-600 dark:text-mono-400">Loading suggestions...</p>
            </div>
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-mono-600 dark:text-mono-400 text-lg mb-2">No suggestions available</p>
            <p className="text-sm text-mono-500 dark:text-mono-500">Check back later for new recommendations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            {suggestedUsers.map((suggestedUser) => (
              <div
                key={suggestedUser._id}
                className="flex items-center gap-4 p-4 rounded-xl border border-mono-200 dark:border-mono-800 hover:bg-mono-50 dark:hover:bg-mono-800 transition-all duration-200 group hover:shadow-lg"
              >
                <Link to={`/profile/${suggestedUser._id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-mono-400 to-mono-600 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
                    <img
                      src={
                        suggestedUser.profilePicture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
                      }
                      alt={suggestedUser.username}
                      className="relative w-16 h-16 rounded-full object-cover border-2 border-mono-200 dark:border-mono-700 group-hover:border-mono-black dark:group-hover:border-mono-white transition-all duration-200 shadow-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-mono-black dark:text-mono-white truncate group-hover:text-mono-700 dark:group-hover:text-mono-300 transition-colors duration-200">
                      {suggestedUser.username}
                    </p>
                    <p className="text-sm text-mono-600 dark:text-mono-500 truncate">
                      {suggestedUser.bio || "No bio yet"}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (followingUsers.has(suggestedUser._id)) {
                      handleUnfollow(suggestedUser._id);
                    } else {
                      handleFollow(suggestedUser._id);
                    }
                  }}
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md flex-shrink-0 ${
                    followingUsers.has(suggestedUser._id)
                      ? "bg-mono-200 dark:bg-mono-700 text-mono-700 dark:text-mono-300 hover:bg-mono-300 dark:hover:bg-mono-600"
                      : "bg-mono-black dark:bg-mono-white text-mono-white dark:text-mono-black hover:bg-mono-700 dark:hover:bg-mono-300"
                  }`}
                >
                  {followingUsers.has(suggestedUser._id) ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedUsersPage;
