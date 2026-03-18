import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../common/Card";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import api from "../../api/api";
import toast from "react-hot-toast";

const Post = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
  const [isSaved, setIsSaved] = useState(user?.savedPosts?.includes(post._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const isOwnPost = post.user?._id === user?._id;

  // Listen for real-time like updates
  useEffect(() => {
    if (!socket) return;

    const handlePostLikeUpdate = ({ postId, likesCount, userId }) => {
      // Only update if this is the same post
      if (postId === post._id) {
        setLikesCount(likesCount);
        // Update isLiked state based on whether current user liked it
        setIsLiked(userId === user?._id ? !isLiked : isLiked);
      }
    };

    const handleNewComment = ({ postId, comment, commentsCount }) => {
      // Only update if this is the same post
      if (postId === post._id) {
        setCommentsCount(commentsCount);
        // Add comment to list if comments are currently visible
        if (showComments) {
          setComments((prev) => {
            // Check if comment already exists to avoid duplicates
            const exists = prev.some((c) => c._id === comment._id);
            if (!exists) {
              return [...prev, comment];
            }
            return prev;
          });
        }
      }
    };

    socket.on("postLikeUpdated", handlePostLikeUpdate);
    socket.on("newComment", handleNewComment);

    return () => {
      socket.off("postLikeUpdated", handlePostLikeUpdate);
      socket.off("newComment", handleNewComment);
    };
  }, [socket, post._id, user?._id, isLiked, showComments]);

  const handleLike = async () => {
    try {
      const response = await api.post(`/posts/like-dislike/${post._id}`);
      if (response.data.status === "Success") {
        setIsLiked(!isLiked);
        // setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.post(`/posts/save/${post._id}`);
      if (response.data.status === "Success") {
        setIsSaved(!isSaved);
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to save post");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await api.post(`/posts/comment/${post._id}`, {
        text: commentText,
      });
      if (response.data.status === "Success") {
        toast.success("Comment added successfully");
        setCommentText("");
        // Comment will be added via socket event
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add comment";
      toast.error(message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const focusCommentInput = () => {
    document.getElementById(`comment-input-${post._id}`)?.focus();
  };

  const fetchComments = async () => {
    if (comments.length > 0) return; // Already loaded

    setLoadingComments(true);
    try {
      const response = await api.get(`/posts/${post._id}/comments`);
      if (response.data.status === "Success") {
        setComments(response.data.data.comments);
      }
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await api.delete(`/posts/delete/${post._id}`);
      if (response.data.status === "Success") {
        toast.success(response.data.message || "Post deleted successfully");
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete post";
      toast.error(message);
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-mono-white dark:bg-[#1E1E1E] rounded-2xl border border-mono-200 dark:border-mono-800 shadow-lg hover:shadow-xl dark:shadow-2xl transition-all duration-300 overflow-hidden"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-mono-100 dark:border-mono-800">
        <Link to={`/profile/${post.user?._id}`} className="flex items-center space-x-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-mono-400 to-mono-600 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            <img
              src={
                post.user?.profilePicture ||
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
              }
              alt={post.user?.username}
              className="relative w-12 h-12 rounded-full object-cover border-2 border-mono-200 dark:border-mono-700 group-hover:border-mono-black dark:group-hover:border-mono-white transition-all duration-200 shadow-md"
            />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-mono-black dark:text-mono-white group-hover:text-mono-700 dark:group-hover:text-mono-300 transition-colors duration-200">
              {post.user?.username}
            </p>
            <p className="text-xs text-[#999999] dark:text-mono-500">
              {new Date(post.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </Link>
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-mono-black dark:text-mono-white p-2 rounded-full hover:bg-mono-200 dark:hover:bg-mono-800 transition-all duration-200"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-mono-white dark:bg-mono-900 rounded-lg shadow-mono-lg border border-mono-300 dark:border-mono-800 z-10"
              >
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-mono-black dark:text-mono-white hover:bg-mono-200 dark:hover:bg-mono-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 border border-transparent hover:border-mono-black dark:hover:border-mono-white"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? "Deleting..." : "Delete Post"}</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Post Image */}
      {/* <div className="w-full bg-mono-100 dark:bg-mono-black">
        <img
          src={post.image?.url}
          alt="Post"
          loading="lazy"
          className="w-full object-cover"
          style={{ maxHeight: "600px" }}
        />
      </div> */}
      {/* 
      <div className="w-full bg-mono-100 dark:bg-mono-black flex justify-center">
  <img
    src={post.image?.url}
    alt="Post"
    loading="lazy"
    className="max-h-[600px] w-auto object-contain"
  />
</div> */}
      {/* <div className="w-full flex justify-center">
  <div className="max-w-[550px] w-full bg-mono-100 dark:bg-mono-black p-4 rounded-xl">
    <img
      src={post.image?.url}
      alt="Post"
      loading="lazy"
      className="object-contain w-full max-h-[700px] rounded-xl"
    />
  </div>
</div> */}

      <div className="w-full bg-mono-100 dark:bg-mono-black flex justify-center px-4 py-4">
        <img
          src={post.image?.url}
          alt="Post"
          loading="lazy"
          className="w-full max-w-[720px] max-h-[700px] object-contain rounded-[12px]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-mono-100 dark:border-mono-800">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="hover:opacity-70 transition-opacity p-1 rounded-full"
          >
            <Heart
              className={`w-6 h-6 transition-colors duration-200 ${
                isLiked
                  ? "fill-mono-black dark:fill-mono-white text-mono-black dark:text-mono-white"
                  : "text-mono-black dark:text-mono-white hover:opacity-60"
              }`}
            />
          </motion.button>

          {/* Comment Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={focusCommentInput}
            className="hover:opacity-70 transition-opacity p-1 rounded-full"
          >
            <MessageCircle className="w-6 h-6 text-mono-black dark:text-mono-white hover:opacity-60 transition-opacity duration-200" />
          </motion.button>
        </div>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className="hover:opacity-70 transition-opacity p-1 rounded-full"
        >
          <Bookmark
            className={`w-6 h-6 transition-colors duration-200 ${
              isSaved
                ? "fill-mono-black dark:fill-mono-white text-mono-black dark:text-mono-white"
                : "text-mono-black dark:text-mono-white hover:opacity-60"
            }`}
          />
        </motion.button>
      </div>

      {/* Likes Count */}
      <div className="px-5 pb-3">
        <p className="font-bold text-sm text-mono-900 dark:text-mono-100">
          {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
        </p>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-5 pb-3">
          <p className="text-sm leading-relaxed">
            <Link
              to={`/profile/${post.user?._id}`}
              className="font-bold text-mono-900 dark:text-mono-100 hover:underline mr-2 transition-all duration-200"
            >
              {post.user?.username}
            </Link>
            <span className="text-mono-700 dark:text-mono-300">{post.caption}</span>
          </p>
        </div>
      )}

      {/* View Comments */}
      {commentsCount > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={toggleComments}
            disabled={loadingComments}
            className="text-sm text-mono-600 dark:text-mono-500 hover:text-mono-black dark:hover:text-mono-white transition-colors duration-200 disabled:opacity-50"
          >
            {loadingComments ? "Loading comments..." : showComments ? "Hide" : "View all"}{" "}
            {!loadingComments && `${commentsCount} ${commentsCount === 1 ? "comment" : "comments"}`}
          </button>
        </div>
      )}

      {/* Comments List */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 pb-2 space-y-2"
        >
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-mono-black dark:border-mono-white"></div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment._id} className="flex items-start space-x-2">
                <Link to={`/profile/${comment.user?._id}`}>
                  <img
                    src={
                      comment.user?.profilePicture ||
                      "https://via.placeholder.com/32https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
                    }
                    alt={comment.user?.username}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-mono-300 dark:ring-mono-700 hover:ring-mono-black dark:hover:ring-mono-white transition-all duration-200"
                  />
                </Link>
                <div className="flex-1">
                  <div className="bg-mono-100 dark:bg-mono-800 rounded-lg px-3 py-2">
                    <Link
                      to={`/profile/${comment.user?._id}`}
                      className="font-semibold text-sm text-mono-black dark:text-mono-white hover:underline transition-all duration-200"
                    >
                      {comment.user?.username}
                    </Link>
                    <p className="text-sm text-mono-black dark:text-mono-white">{comment.text}</p>
                  </div>
                  <p className="text-xs text-mono-600 dark:text-mono-500 mt-1 ml-3">
                    {new Date(comment.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-mono-600 dark:text-mono-500 text-center py-2">No comments yet</p>
          )}
        </motion.div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleComment} className="border-t border-mono-200 dark:border-mono-800 p-4">
        <div className="flex items-center space-x-3">
          <input
            id={`comment-input-${post._id}`}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 outline-none text-sm bg-transparent text-mono-black dark:text-mono-white placeholder-mono-600 dark:placeholder-mono-500 focus:placeholder-mono-500 dark:focus:placeholder-mono-600 transition-colors duration-200"
            disabled={submittingComment}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || submittingComment}
            className="text-mono-black dark:text-mono-white font-semibold text-sm hover:underline hover:opacity-70 disabled:text-mono-500 dark:disabled:text-mono-600 disabled:cursor-not-allowed disabled:hover:no-underline disabled:hover:opacity-100 transition-all duration-200"
          >
            {submittingComment ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Post;
