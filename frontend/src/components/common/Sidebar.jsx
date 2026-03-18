import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";

const Sidebar = () => {
  const { user, updateUser } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState(new Set());

  useEffect(() => {
    fetchSuggestedUsers();
  }, []); // Remove user dependency

  useEffect(() => {
    // Initialize followingUsers with current user's following list
    if (user?.following) {
      setFollowingUsers(new Set(user.following));
    }
  }, [user?.following]); // Only depend on the following array

  const fetchSuggestedUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users/suggested-users");
      if (response.data.status === "success") {
        setSuggestedUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
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

        // Update the user object in AuthContext to reflect the new following count
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

  return (
    <div className="fixed top-20 w-[23%] max-w-[18rem] space-y-5 h-[calc(100vh-7rem)] flex flex-col">
      {/* Current User Card */}
      <div className="bg-mono-white dark:bg-mono-900 border border-mono-200 dark:border-mono-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-mono-400 to-mono-600 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
            <img
              src={
                user?.profilePicture ||
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
              }
              alt={user?.username}
              className="relative w-14 h-14 rounded-full object-cover border-2 border-mono-200 dark:border-mono-700 group-hover:border-mono-black dark:group-hover:border-mono-white transition-all duration-200 flex-shrink-0 shadow-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${user?._id}`}
              className="font-bold text-mono-black dark:text-mono-white hover:text-mono-700 dark:hover:text-mono-300 block transition-colors duration-200 truncate"
            >
              {user?.username}
            </Link>
            <p className="text-sm text-mono-600 dark:text-mono-500 truncate">{user?.email}</p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-mono-200 dark:border-mono-800">
          <div className="flex justify-between text-sm text-mono-600 dark:text-mono-500 mb-4">
            <div className="text-center">
              <div className="font-bold text-lg text-mono-black dark:text-mono-white">
                {(user?.followers?.length || 0).toLocaleString()}
              </div>
              <div className="text-xs font-medium">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-mono-black dark:text-mono-white">
                {(user?.following?.length || 0).toLocaleString()}
              </div>
              <div className="text-xs font-medium">Following</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-mono-black dark:text-mono-white">
                {(user?.posts?.length || 0).toLocaleString()}
              </div>
              <div className="text-xs font-medium">Posts</div>
            </div>
          </div>

          <Link
            to="/edit-profile"
            className="block text-center text-sm text-mono-black dark:text-mono-white hover:bg-mono-100 dark:hover:bg-mono-800 font-semibold transition-all duration-200 py-2 rounded-lg hover:scale-105"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Suggested Users Card */}
      <div className="bg-mono-white dark:bg-mono-900 rounded-2xl border border-mono-200 dark:border-mono-800 shadow-lg hover:shadow-xl p-5 transition-all duration-300 flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center mb-5 flex-shrink-0">
          <h3 className="font-bold text-mono-black dark:text-mono-white text-lg">Suggested for You</h3>
          {!loading && suggestedUsers.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                fetchSuggestedUsers();
              }}
              className="text-mono-black dark:text-mono-white hover:rotate-180 transition-all duration-300 transform p-2 hover:bg-mono-100 dark:hover:bg-mono-800 rounded-lg"
              title="Refresh suggestions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-mono-black dark:border-mono-white mx-auto"></div>
            </div>
          ) : suggestedUsers.length === 0 ? (
            <p className="text-sm text-mono-600 dark:text-mono-500 text-center py-4">No suggestions available</p>
          ) : (
            <>
              <div className="space-y-3">
                {suggestedUsers.slice(0, 3).map((suggestedUser) => (
                  <div
                    key={suggestedUser._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-mono-50 dark:hover:bg-mono-800 transition-all duration-200 group hover:shadow-md"
                  >
                    <Link to={`/profile/${suggestedUser._id}`} className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-mono-400 to-mono-600 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
                        <img
                          src={suggestedUser.profilePicture || "https://via.placeholder.com/40"}
                          alt={suggestedUser.username}
                          className="relative w-11 h-11 rounded-full object-cover border-2 border-mono-200 dark:border-mono-700 group-hover:border-mono-black dark:group-hover:border-mono-white transition-all duration-200 shadow-md"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-mono-black dark:text-mono-white truncate group-hover:text-mono-700 dark:group-hover:text-mono-300 transition-colors duration-200">
                          {suggestedUser.username}
                        </p>
                        <p className="text-xs text-mono-600 dark:text-mono-500 truncate">
                          {suggestedUser.bio || "No bio yet"}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFollow(suggestedUser._id);
                      }}
                      disabled={followingUsers.has(suggestedUser._id)}
                      className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none disabled:cursor-not-allowed bg-mono-black dark:bg-mono-white text-mono-white dark:text-mono-black hover:bg-mono-700 dark:hover:bg-mono-300 disabled:bg-mono-300 dark:disabled:bg-mono-700 disabled:text-mono-500 disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                      {followingUsers.has(suggestedUser._id) ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>

              {suggestedUsers.length > 3 && (
                <Link
                  to="/suggested-users"
                  className="block text-center mt-4 text-sm text-mono-black dark:text-mono-white hover:bg-mono-100 dark:hover:bg-mono-800 font-semibold transition-all duration-200 py-2.5 rounded-lg hover:scale-105 border border-mono-200 dark:border-mono-700 hover:border-mono-black dark:hover:border-mono-white"
                >
                  See All
                </Link>
              )}
            </>
          )}
        </div>
        {/* ))} */}
      </div>
      {/* )} */}
    </div>
    //   </div>
    // </div>
  );
};

export default Sidebar;
