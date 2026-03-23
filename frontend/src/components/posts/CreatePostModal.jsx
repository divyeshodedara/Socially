// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { X, Image as ImageIcon, Loader2 } from "lucide-react";
// import api from "../../api/api";
// import toast from "react-hot-toast";

// const CreatePostModal = ({ isOpen, onClose }) => {
//   const navigate = useNavigate();
//   const [caption, setCaption] = useState("");
//   const [imageFile, setImageFile] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // Validate file type
//       if (!file.type.startsWith("image/")) {
//         toast.error("Please select an image file");
//         return;
//       }

//       // Validate file size (max 5MB)
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error("Image size should be less than 5MB");
//         return;
//       }

//       setImageFile(file);
//       // Create preview URL
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setPreviewUrl(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleRemoveImage = () => {
//     setImageFile(null);
//     setPreviewUrl("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!imageFile) {
//       toast.error("Please select an image");
//       return;
//     }

//     setLoading(true);

//     try {
//       // Create FormData for file upload
//       const formData = new FormData();
//       formData.append("caption", caption.trim() || ""); // Allow empty caption
//       formData.append("image", imageFile);

//       const response = await api.post("/posts/create-post", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       if (
//         response.data.status === "Success" ||
//         response.data.status === "success"
//       ) {
//         toast.success(response.data.message || "Post created successfully!");
//         // Reset form
//         setCaption("");
//         setImageFile(null);
//         setPreviewUrl("");
//         onClose();
//         // Navigate to home to see the new post
//         navigate("/");
//       }
//     } catch (error) {
//       const message = error.response?.data?.message || "Failed to create post";
//       toast.error(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClose = () => {
//     if (!loading) {
//       // Reset form on close
//       setCaption("");
//       setImageFile(null);
//       setPreviewUrl("");
//       onClose();
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
//       onClick={handleClose}
//     >
//       <div
//         className="bg-mono-white dark:bg-mono-900 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-mono-300 dark:border-mono-800 shadow-mono-xl"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-mono-300 dark:border-mono-800">
//           <h2 className="text-xl font-bold text-mono-black dark:text-mono-white">
//             Create New Post
//           </h2>
//           <button
//             onClick={handleClose}
//             disabled={loading}
//             className="text-mono-600 dark:text-mono-500 hover:text-mono-black dark:hover:text-mono-white disabled:opacity-50 transition-all duration-200"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} autoComplete="off" className="p-4">
//           {/* Image Upload Section */}
//           <div className="mb-4">
//             {previewUrl ? (
//               <div className="relative">
//                 <img
//                   src={previewUrl}
//                   alt="Post preview"
//                   className="w-full max-h-96 object-cover rounded-lg"
//                 />
//                 <button
//                   type="button"
//                   onClick={handleRemoveImage}
//                   disabled={loading}
//                   className="absolute top-2 right-2 bg-mono-black dark:bg-mono-white text-mono-white dark:text-mono-black p-2 rounded-full hover:opacity-80 transition-all duration-200 disabled:opacity-50"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//             ) : (
//               <label
//                 htmlFor="image"
//                 className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-mono-300 dark:border-mono-700 rounded-lg cursor-pointer hover:border-mono-black dark:hover:border-mono-white transition-all duration-200 bg-mono-100 dark:bg-mono-800"
//               >
//                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
//                   <ImageIcon className="w-12 h-12 mb-3 text-mono-600 dark:text-mono-500" />
//                   <p className="mb-2 text-sm text-mono-600 dark:text-mono-500">
//                     <span className="font-semibold">Click to upload</span> or
//                     drag and drop
//                   </p>
//                   <p className="text-xs text-mono-600 dark:text-mono-500">
//                     PNG, JPG, GIF up to 5MB
//                   </p>
//                 </div>
//                 <input
//                   type="file"
//                   id="image"
//                   accept="image/*"
//                   onChange={handleFileChange}
//                   className="hidden"
//                   disabled={loading}
//                 />
//               </label>
//             )}
//           </div>

//           {/* Caption */}
//           <div className="mb-4">
//             <label
//               htmlFor="caption"
//               className="block text-sm font-medium text-mono-black dark:text-mono-white mb-1"
//             >
//               Caption <span className="text-mono-500 text-xs">(Optional)</span>
//             </label>
//             <textarea
//               id="caption"
//               name="post-caption-text"
//               value={caption}
//               onChange={(e) => setCaption(e.target.value)}
//               rows={4}
//               maxLength={500}
//               autoComplete="off"
//               autoCorrect="off"
//               autoCapitalize="off"
//               spellCheck="false"
//               data-form-type="other"
//               className="w-full resize-none bg-mono-white dark:bg-mono-900 border-2 border-mono-300 dark:border-mono-700 rounded-lg px-3 py-2 text-mono-black dark:text-mono-white placeholder-mono-600 dark:placeholder-mono-500 focus:ring-2 focus:ring-mono-black dark:focus:ring-mono-white focus:border-mono-black dark:focus:border-mono-white transition-all duration-200"
//               placeholder="Write a caption..."
//               disabled={loading}
//             />
//             <p className="text-xs text-mono-600 dark:text-mono-500 mt-1">
//               {caption.length}/500 characters
//             </p>
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={loading || !imageFile}
//             className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-mono-black dark:bg-mono-white text-mono-white dark:text-mono-black hover:opacity-80 transition-all duration-200 py-2 px-4 rounded-lg font-medium"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 Creating Post...
//               </>
//             ) : (
//               "Create Post"
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreatePostModal;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api/api";
import toast from "react-hot-toast";

const CreatePostModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file");
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be less than 5MB");
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) return toast.error("Please select an image");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("caption", caption.trim() || "");
      formData.append("image", imageFile);

      const res = await api.post("/posts/create-post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.status === "Success" || res.data.status === "success") {
        toast.success("Post created");
        setCaption("");
        setImageFile(null);
        setPreviewUrl("");
        onClose();
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCaption("");
      setImageFile(null);
      setPreviewUrl("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-[#0f0f0f] rounded-card w-full max-w-lg border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-black dark:text-white">Create New Post</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* Upload */}
          {!previewUrl ? (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="w-full aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed rounded-card cursor-pointer border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-500/10 transition"
            >
              <ImageIcon className="w-10 h-10 mb-2 text-gray-500 dark:text-gray-400" />
              <p className="text-sm font-medium text-black dark:text-white">Click or drag image</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>

              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div className="relative w-full max-h-[60vh] rounded-card overflow-hidden bg-black flex items-center justify-center">
              <img src={previewUrl} alt="preview" className="max-h-[60vh] w-auto object-contain" />

              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Write something cool..."
              className="w-full rounded-input px-4 py-3 outline-none resize-none bg-gray-100 dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
            />
            <p className="text-xs text-right text-gray-500 dark:text-gray-400">{caption.length}/500</p>
          </div>

          {/* Button */}
          <button
            disabled={!imageFile || loading}
            className="w-full py-3 rounded-btn font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin w-5 h-5" />
                Posting...
              </span>
            ) : (
              "Create Post"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreatePostModal;
