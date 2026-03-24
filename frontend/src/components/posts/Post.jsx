import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../ui/Card";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import api from "../../api/api";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
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

  const queryClient = useQueryClient();

  const isOwnPost = post.user?._id === user?._id;

  // Listen for real-time like updates
  useEffect(() => {
    if (!socket) return;

    const handlePostLikeUpdate = ({ postId, likesCount, userId }) => {
      if (postId === post._id) {
        setLikesCount(likesCount);

        // Only update isLiked if the current user triggered this event
        // Use functional updater to always read current state, not stale closure
        if (userId === user?._id) {
          setIsLiked((prev) => !prev);
        }
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
  }, [socket, post._id, user?._id, showComments]);

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

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check this post",
          text: post.caption || "Interesting post!",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch (err) {
      console.log(err);
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

        queryClient.invalidateQueries(["posts", "feed"]);
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
      className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-200 dark:border-mono-800 shadow-lg"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/profile/${post.user?._id}`} className="flex items-center space-x-3 group">
          <img
            src={
              post.user?.profilePicture ||
              "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
            }
            alt={post.user?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-sm text-mono-black dark:text-mono-white group-hover:underline">
                {post.user?.name || post.user?.username}
              </p>
              <p className="text-sm text-mono-500 dark:text-mono-400">@{post.user?.username}</p>
            </div>
            <p className="text-sm text-mono-500 dark:text-mono-400">
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </Link>
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-mono-600 dark:text-mono-400 p-2 rounded-full hover:bg-mono-100 dark:hover:bg-mono-800"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-2 w-40 bg-mono-white dark:bg-mono-900 rounded-input shadow-lg border border-mono-200 dark:border-mono-800 z-10"
              >
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? "Deleting..." : "Delete Post"}</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-mono-800 dark:text-mono-200 leading-relaxed">{post.caption}</p>
        </div>
      )}

      {/* Post Image */}
      {post.image?.url && (
        <div className="w-full px-4 pb-3">
          <div
            onDoubleClick={handleLike}
            className="w-full max-w-[550px] mx-auto aspect-[4/3] bg-mono-100 dark:bg-mono-black rounded-card overflow-hidden"
          >
            <img
              src={post.image.url}
              alt="Post"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 "
            />
          </div>
        </div>
      )}
      {/* Action Buttons */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center space-x-6 text-mono-600 dark:text-mono-400">
          <button
            onClick={handleLike}
            className="flex items-center space-x-2 hover:scale-110 hover:text-blue-500 transition-all duration-200"
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-blue-500" : ""}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
          <button
            onClick={toggleComments}
            className="flex items-center space-x-2 hover:scale-110 hover:text-blue-500 transition-all duration-200"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 hover:scale-110 hover:text-green-500 transition-all duration-200"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="text-mono-600 dark:text-mono-400 hover:text-blue-500 dark:hover:text-blue-500 transition-colors duration-200"
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current text-blue-500" : ""}`} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
          className="border-t border-mono-200 dark:border-mono-800 pt-4 px-4 pb-2"
        >
          {/* Add Comment Form */}
          <form onSubmit={handleComment} className="flex items-center space-x-3 mb-4">
            <img
              src={
                user?.profilePicture ||
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
              }
              alt="Your profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            <input
              id={`comment-input-${post._id}`}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-mono-100 dark:bg-mono-800 border border-mono-200 dark:border-mono-700 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submittingComment}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submittingComment}
              className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:text-mono-400 disabled:cursor-not-allowed"
            >
              {submittingComment ? "Posting..." : "Post"}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="flex items-start space-x-3">
                  <Link to={`/profile/${comment.user?._id}`}>
                    <img
                      src={comment.user?.profilePicture || "https://via.placeholder.com/32"}
                      alt={comment.user?.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="bg-mono-100 dark:bg-mono-800 rounded-card px-3 py-2">
                      <Link
                        to={`/profile/${comment.user?._id}`}
                        className="font-semibold text-sm text-mono-black dark:text-mono-white hover:underline"
                      >
                        {comment.user?.username}
                      </Link>
                      <p className="text-sm text-mono-800 dark:text-mono-200">{comment.text}</p>
                    </div>
                    <p className="text-xs text-mono-500 mt-1 ml-2">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-mono-500 text-center py-2">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Post;

// import { motion } from "framer-motion";
// import { Link } from "react-router-dom";
// import { Heart, MessageCircle, Bookmark, MoreHorizontal, Trash2, ArrowRight } from "lucide-react";

// const Post = ({
//   post,
//   isOwnPost,
//   handleLike,
//   toggleComments,
//   handleSave,
//   handleDelete,
//   handleComment,
//   comments,
//   loadingComments,
//   showComments,
//   setShowMenu,
//   showMenu,
//   deleting,
//   commentText,
//   setCommentText,
//   submittingComment,
//   likesCount,
//   commentsCount,
//   isLiked,
//   isSaved,
//   user,
// }) => {
//   // 🔥 SHARE FUNCTION
//   const handleShare = async () => {
//     const url = `${window.location.origin}/post/${post._id}`;

//     try {
//       if (navigator.share) {
//         await navigator.share({
//           title: "Check this post",
//           text: post.caption || "Interesting post!",
//           url,
//         });
//       } else {
//         await navigator.clipboard.writeText(url);
//         alert("Link copied!");
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4, ease: "easeOut" }}
//       className="bg-mono-white dark:bg-mono-900 rounded-card border border-mono-200 dark:border-mono-800 shadow-lg"
//     >
//       {/* HEADER */}
//       <div className="flex items-center justify-between px-4 py-3">
//         <Link to={`/profile/${post.user?._id}`} className="flex items-center space-x-3 group">
//           <img
//             src={
//               post.user?.profilePicture ||
//               "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU0a0iDtUPUzs0GFM6DSuovK0uOE4-Sc40Pg&s"
//             }
//             alt={post.user?.username}
//             className="w-10 h-10 rounded-full object-cover"
//           />
//           <div className="flex items-center space-x-2 flex-wrap">
//             <p className="font-semibold text-sm text-mono-black dark:text-mono-white group-hover:underline transition">
//               {post.user?.name || post.user?.username}
//             </p>
//             <p className="text-sm text-mono-500 dark:text-mono-400">@{post.user?.username}</p>
//             <p className="text-sm text-mono-500 dark:text-mono-400">
//               ·{" "}
//               {formatDistanceToNow(new Date(post.createdAt), {
//                 addSuffix: true,
//               })}
//             </p>
//           </div>
//         </Link>

//         {isOwnPost && (
//           <div className="relative">
//             <button
//               onClick={() => setShowMenu(!showMenu)}
//               className="p-2 rounded-full hover:bg-mono-100 dark:hover:bg-mono-800"
//             >
//               <MoreHorizontal className="w-5 h-5" />
//             </button>

//             {showMenu && (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.95 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 className="absolute right-0 mt-2 w-40 bg-mono-white dark:bg-mono-900 rounded-input shadow-lg border z-10"
//               >
//                 <button
//                   onClick={handleDelete}
//                   disabled={deleting}
//                   className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                   {deleting ? "Deleting..." : "Delete Post"}
//                 </button>
//               </motion.div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* CAPTION */}
//       {post.caption && (
//         <div className="px-4 pb-3">
//           <p className="text-mono-800 dark:text-mono-200 leading-relaxed">{post.caption}</p>
//         </div>
//       )}

//       {/* IMAGE (FIXED 🔥) */}
//       {post.image?.url && (
//         <div className="px-4 pb-3">
//           <div
//             onDoubleClick={handleLike}
//             className="w-full max-h-[500px] overflow-hidden rounded-card border border-mono-200 dark:border-mono-800"
//           >
//             <img
//               src={post.image.url}
//               alt="Post"
//               loading="lazy"
//               className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
//             />
//           </div>
//         </div>
//       )}

//       {/* ACTION BUTTONS */}
//       <div className="flex items-center justify-between px-4 pb-2">
//         <div className="flex items-center space-x-6 text-mono-600 dark:text-mono-400">
//           {/* LIKE */}
//           <button
//             onClick={handleLike}
//             className="flex items-center space-x-2 hover:scale-110 hover:text-red-500 transition-all duration-200"
//           >
//             <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-red-500" : ""}`} />
//             <span className="text-sm font-medium">{likesCount}</span>
//           </button>

//           {/* COMMENT */}
//           <button
//             onClick={toggleComments}
//             className="flex items-center space-x-2 hover:scale-110 hover:text-blue-500 transition-all duration-200"
//           >
//             <MessageCircle className="w-5 h-5" />
//             <span className="text-sm font-medium">{commentsCount}</span>
//           </button>

//           {/* SHARE */}
//           <button
//             onClick={handleShare}
//             className="flex items-center space-x-2 hover:scale-110 hover:text-green-500 transition-all duration-200"
//           >
//             <ArrowRight className="w-5 h-5" />
//           </button>
//         </div>

//         {/* SAVE */}
//         <button onClick={handleSave} className="hover:text-yellow-500 transition-colors duration-200">
//           <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current text-yellow-500" : ""}`} />
//         </button>
//       </div>

//       {/* COMMENTS */}
//       {showComments && (
//         <motion.div
//           initial={{ opacity: 0, height: 0 }}
//           animate={{ opacity: 1, height: "auto" }}
//           className="border-t border-mono-200 dark:border-mono-800 pt-4 px-4 pb-2"
//         >
//           {/* ADD COMMENT */}
//           <form onSubmit={handleComment} className="flex items-center space-x-3 mb-4">
//             <img
//               src={user?.profilePicture || "https://via.placeholder.com/32"}
//               alt=""
//               className="w-8 h-8 rounded-full object-cover"
//             />
//             <input
//               type="text"
//               value={commentText}
//               onChange={(e) => setCommentText(e.target.value)}
//               placeholder="Add a comment..."
//               className="flex-1 bg-mono-100 dark:bg-mono-800 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <button
//               type="submit"
//               disabled={!commentText.trim() || submittingComment}
//               className="text-blue-500 font-semibold text-sm"
//             >
//               {submittingComment ? "Posting..." : "Post"}
//             </button>
//           </form>

//           {/* COMMENTS LIST */}
//           <div className="space-y-4">
//             {loadingComments ? (
//               <div className="text-center py-4">
//                 <div className="animate-spin h-6 w-6 border-t-2 border-blue-500 mx-auto rounded-full"></div>
//               </div>
//             ) : comments.length > 0 ? (
//               comments.map((comment) => (
//                 <div key={comment._id} className="flex space-x-3">
//                   <img
//                     src={comment.user?.profilePicture || "https://via.placeholder.com/32"}
//                     alt=""
//                     className="w-8 h-8 rounded-full object-cover"
//                   />
//                   <div>
//                     <p className="font-semibold text-sm">{comment.user?.username}</p>
//                     <p className="text-sm">{comment.text}</p>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p className="text-sm text-center">No comments yet</p>
//             )}
//           </div>
//         </motion.div>
//       )}
//     </motion.div>
//   );
// };

// export default Post;
