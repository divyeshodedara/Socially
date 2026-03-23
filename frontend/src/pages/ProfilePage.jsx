import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Grid, Bookmark, LogOut, MessageCircle, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const isOwnProfile = currentUser?._id === id;

  // Fetch user profile with React Query
  const {
    data: profile = null,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const response = await api.get(`/users/profile/${id}`);
      if (response.data.status === "success") {
        return response.data.data.user;
      }
      throw new Error("Failed to load profile");
    },
    staleTime: 120000, // Cache for 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error.response?.status === 429) return false;
      return failureCount < 2;
    },
  });

  // Fetch user posts with React Query
  const {
    data: posts = [],
    isLoading: postsLoading,
    error: postsError,
  } = useQuery({
    queryKey: ["posts", "user", id],
    queryFn: async () => {
      const response = await api.get(`/posts/user-posts/${id}`);
      if (response.data.status === "Success") {
        return response.data.data.posts || [];
      }
      throw new Error("Failed to load posts");
    },
    staleTime: 60000, // Cache for 1 minute
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error.response?.status === 429) return false;
      return failureCount < 2;
    },
  });

  const loading = profileLoading || postsLoading;
  const error = profileError || postsError;

  // const loading = profileLoading || postsLoading;
  // const error = profileError || postsError;

  const savedPosts = profile?.savedPosts || [];

  // Update isFollowing state when profile or currentUser changes
  useEffect(() => {
    if (profile?.followers && currentUser?._id) {
      setIsFollowing(profile.followers.includes(currentUser._id));
    }
  }, [profile?.followers, currentUser?._id]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const response = await api.post(`/users/follow/${id}`);
      if (response.data.status === "success") {
        toast.success(response.data.message || "User followed successfully");
        setIsFollowing(true);

        // Update profile cache optimistically
        queryClient.setQueryData(["user", id], (old) => ({
          ...old,
          followers: [...(old.followers || []), currentUser._id],
        }));

        // Update current user's following list in AuthContext
        updateUser({
          ...currentUser,
          following: [...(currentUser.following || []), id],
        });
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to follow user";
      toast.error(message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setFollowLoading(true);
    try {
      const response = await api.post(`/users/unfollow/${id}`);
      if (response.data.status === "success") {
        toast.success(response.data.message || "User unfollowed successfully");
        setIsFollowing(false);

        // Update profile cache optimistically
        queryClient.setQueryData(["user", id], (old) => ({
          ...old,
          followers: old.followers.filter((fId) => fId !== currentUser._id),
        }));

        // Update current user's following list in AuthContext
        updateUser({
          ...currentUser,
          following: currentUser.following.filter((fId) => fId !== id),
        });
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to unfollow user";
      toast.error(message);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mono-black dark:border-mono-white"></div>
      </div>
    );
  }

  if (error?.response?.status === 429) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-200 dark:border-mono-800 p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="flex flex-col items-center text-center group">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-mono-400 to-mono-600 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative text-6xl transform group-hover:scale-110 transition-transform duration-300">
                ⏱️
              </div>
            </div>
            <h2 className="text-3xl font-bold text-mono-black dark:text-mono-white mb-3">Too Many Requests</h2>
            <p className="text-lg text-mono-600 dark:text-mono-400 mb-6 max-w-md">
              {error.response?.data?.message ||
                "You've made too many attempts. Please take a break and try again later."}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-mono-black dark:bg-mono-white text-mono-white dark:text-mono-black font-semibold rounded-btn hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-mono-200 dark:bg-mono-800 text-mono-black dark:text-mono-white font-semibold rounded-btn hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    const errorMessage = error?.message || error?.response?.data?.message || "Profile not found";
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-200 dark:border-mono-800 p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="text-6xl mb-6">😕</div>
            <h2 className="text-2xl font-bold text-mono-black dark:text-mono-white mb-3">{errorMessage}</h2>
            <button
              onClick={() => {
                queryClient.invalidateQueries(["user", id]);
                queryClient.invalidateQueries(["posts", "user", id]);
              }}
              className="mt-4 px-6 py-3 bg-mono-black dark:bg-mono-white text-mono-white dark:text-mono-black font-semibold rounded-btn hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-200 dark:border-mono-800 p-8 mb-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-mono-400 to-mono-600 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
              <img
                src={
                  profile.profilePicture ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
                }
                alt={profile.username}
                className="relative w-36 h-36 rounded-full object-cover border-4 border-mono-200 dark:border-mono-700 shadow-xl"
              />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {/* Username and Action Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
              <h1 className="text-3xl font-bold text-mono-black dark:text-mono-white">{profile.username}</h1>

              {isOwnProfile ? (
                <div className="flex gap-3">
                  <Link
                    to="/edit-profile"
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-mono-200 dark:border-mono-700 rounded-btn hover:bg-mono-50 dark:hover:bg-mono-800 text-mono-black dark:text-mono-white transition-all duration-200 font-semibold hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-mono-200 dark:border-mono-700 rounded-btn hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 dark:hover:border-red-500 text-mono-black dark:text-mono-white hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 font-semibold hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-2.5 rounded-btn font-bold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md hover:scale-105 ${
                      isFollowing
                        ? "bg-mono-white dark:bg-mono-black border-2 border-mono-200 dark:border-mono-700 hover:bg-mono-50 dark:hover:bg-mono-900 text-mono-black dark:text-mono-white"
                        : "bg-mono-black dark:bg-mono-white hover:bg-mono-700 dark:hover:bg-mono-300 text-mono-white dark:text-mono-black"
                    }`}
                  >
                    {followLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
                  </button>
                  <button
                    onClick={() => navigate(`/messages/${id}`)}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-mono-200 dark:border-mono-700 rounded-btn hover:bg-mono-50 dark:hover:bg-mono-800 text-mono-black dark:text-mono-white transition-all duration-200 font-semibold hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Message</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-10 mb-5">
              <div className="text-center">
                <span className="font-bold text-2xl text-mono-black dark:text-mono-white">
                  {posts.length.toLocaleString()}
                </span>
                <p className="text-mono-600 dark:text-mono-500 text-sm font-medium">Posts</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-2xl text-mono-black dark:text-mono-white">
                  {(profile.followers?.length || 0).toLocaleString()}
                </span>
                <p className="text-mono-600 dark:text-mono-500 text-sm font-medium">Followers</p>
              </div>
              <div className="text-center">
                <span className="font-bold text-2xl text-mono-black dark:text-mono-white">
                  {(profile.following?.length || 0).toLocaleString()}
                </span>
                <p className="text-mono-600 dark:text-mono-500 text-sm font-medium">Following</p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="text-mono-700 dark:text-mono-300">
                <p className="whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Email (only for own profile) */}
            {isOwnProfile && (
              <div className="mt-3 text-sm text-mono-600 dark:text-mono-500 font-medium">{profile.email}</div>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-200 dark:border-mono-800 shadow-xl">
        {/* Tabs */}
        <div className="flex border-b border-mono-200 dark:border-mono-800">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all duration-200 ${
              activeTab === "posts"
                ? "text-mono-black dark:text-mono-white border-b-2 border-mono-black dark:border-mono-white bg-mono-50 dark:bg-mono-950"
                : "text-mono-600 dark:text-mono-500 hover:text-mono-black dark:hover:text-mono-white hover:bg-mono-50 dark:hover:bg-mono-950"
            }`}
          >
            <Grid className="w-5 h-5" />
            <span>Posts</span>
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all duration-200 ${
                activeTab === "saved"
                  ? "text-mono-black dark:text-mono-white border-b-2 border-mono-black dark:border-mono-white bg-mono-50 dark:bg-mono-950"
                  : "text-mono-600 dark:text-mono-500 hover:text-mono-black dark:hover:text-mono-white hover:bg-mono-50 dark:hover:bg-mono-950"
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span>Saved</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "posts" ? (
            posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-mono-600 dark:text-mono-500">No posts yet</p>
                {isOwnProfile && (
                  <p className="text-sm text-mono-600 dark:text-mono-500 mt-2">Share your first post to get started!</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    onClick={() => navigate("/", { state: { postId: post._id } })}
                    className="relative group overflow-hidden bg-mono-100 dark:bg-mono-800 hover:opacity-95 transition-all duration-200 rounded-card aspect-square cursor-pointer"
                  >
                    <img src={post.image?.url} alt="Post" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="w-5 h-5 fill-white" />
                          <span className="font-semibold">{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-5 h-5" />
                          <span className="font-semibold">{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : savedPosts.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-mono-400 dark:text-mono-700 mx-auto mb-4" />
              <p className="text-mono-600 dark:text-mono-500">No saved posts yet</p>
              <p className="text-sm text-mono-600 dark:text-mono-500 mt-2">Posts you save will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {savedPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => navigate("/", { state: { postId: post._id } })}
                  className="relative group overflow-hidden bg-mono-100 dark:bg-mono-800 hover:opacity-95 transition-all duration-200 rounded-card aspect-square cursor-pointer"
                >
                  <img src={post.image?.url} alt="Saved Post" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="w-5 h-5 fill-white" />
                        <span className="font-semibold">{post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-semibold">{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
