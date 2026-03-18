import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, PlusSquare, User, Search, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CreatePostModal from "../posts/CreatePostModal";
import DarkModeToggle from "./DarkModeToggle";
import NotificationBell from "./NotificationBell";
import MessageIcon from "./MessageIcon";
import api from "../../api/api";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const handleCreatePost = () => {
    setIsModalOpen(true);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`);
        if (response.data.status === "success") {
          setSearchResults(response.data.data.users);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleUserClick = (userId) => {
    setSearchQuery("");
    setShowResults(false);
    navigate(`/profile/${userId}`);
  };

  return (
    <nav className="bg-mono-white dark:bg-mono-black border-b border-mono-200 dark:border-mono-900 sticky top-0 z-50 transition-colors duration-300 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink
            to="/"
            className="text-2xl font-bold text-mono-black dark:text-mono-white hover:text-mono-600 dark:hover:text-mono-400 transition-all duration-200 tracking-tight hover:scale-105"
          >
            Socially
          </NavLink>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mono-500 dark:text-mono-400 w-5 h-5 transition-colors" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full pl-10 pr-4 py-2.5 bg-mono-50 dark:bg-mono-900 border border-mono-200 dark:border-mono-700 rounded-full focus:outline-none focus:ring-2 focus:ring-mono-black dark:focus:ring-mono-white focus:border-transparent hover:border-mono-400 dark:hover:border-mono-600 hover:shadow-md text-mono-black dark:text-mono-white placeholder-mono-500 dark:placeholder-mono-400 transition-all duration-200"
              />

              {/* Search Results Dropdown */}
              {showResults && searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-mono-white dark:bg-mono-900 border border-mono-200 dark:border-mono-700 rounded-2xl shadow-xl max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-mono-600 dark:text-mono-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      <p>Searching...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-mono-600 dark:text-mono-400">No users found</div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser._id}
                          onClick={() => handleUserClick(searchUser._id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-mono-50 dark:hover:bg-mono-800 transition-colors"
                        >
                          <img
                            src={searchUser.profilePicture || "https://via.placeholder.com/40"}
                            alt={searchUser.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-mono-200 dark:border-mono-700"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-mono-black dark:text-mono-white">{searchUser.username}</p>
                            {searchUser.bio && (
                              <p className="text-sm text-mono-600 dark:text-mono-400 truncate">{searchUser.bio}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Notification Bell */}
            <NotificationBell />

            {/* Home */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                  isActive
                    ? "text-mono-white dark:text-mono-black bg-mono-black dark:bg-mono-white scale-105"
                    : "text-mono-black dark:text-mono-white hover:bg-mono-100 dark:hover:bg-mono-900 hover:scale-105"
                }`
              }
              title="Home"
            >
              <Home className="w-6 h-6" />
              <span className="hidden lg:inline font-semibold">Home</span>
            </NavLink>

            {/* Create Post */}
            <button
              onClick={handleCreatePost}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-mono-black dark:text-mono-white hover:bg-mono-100 dark:hover:bg-mono-900 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
              title="Create Post"
            >
              <PlusSquare className="w-6 h-6" />
              <span className="hidden lg:inline font-semibold">Create</span>
            </button>

            {/* Messages */}
            <MessageIcon />

            {/* Profile */}
            <NavLink
              to={`/profile/${user?._id}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group ${
                  isActive
                    ? "text-mono-white dark:text-mono-black bg-mono-black dark:bg-mono-white scale-105"
                    : "text-mono-black dark:text-mono-white hover:bg-mono-100 dark:hover:bg-mono-900 hover:scale-105"
                }`
              }
              title="Profile"
            >
              {user?.profilePicture ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-mono-400 to-mono-600 rounded-full blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="relative w-8 h-8 rounded-full object-cover border-2 border-mono-200 dark:border-mono-800 group-hover:border-mono-black dark:group-hover:border-mono-white transition-colors duration-200 shadow-md"
                  />
                </div>
              ) : (
                <User className="w-6 h-6" />
              )}
              <span className="hidden lg:inline font-semibold">{user?.username}</span>
            </NavLink>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mono-500 dark:text-mono-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-mono-50 dark:bg-mono-900 border border-mono-200 dark:border-mono-700 rounded-full focus:outline-none focus:ring-2 focus:ring-mono-black dark:focus:ring-mono-white focus:border-transparent hover:shadow-md text-mono-black dark:text-mono-white placeholder-mono-500 dark:placeholder-mono-400 transition-all duration-200"
            />

            {/* Mobile Search Results */}
            {showResults && searchQuery && (
              <div className="absolute top-full mt-2 w-full bg-mono-white dark:bg-mono-900 border border-mono-200 dark:border-mono-700 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-50 left-0 right-0">
                {isSearching ? (
                  <div className="p-4 text-center text-mono-600 dark:text-mono-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <p>Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-mono-600 dark:text-mono-400">No users found</div>
                ) : (
                  <div className="py-2">
                    {searchResults.map((searchUser) => (
                      <button
                        key={searchUser._id}
                        onClick={() => handleUserClick(searchUser._id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-mono-50 dark:hover:bg-mono-800 transition-colors"
                      >
                        <img
                          src={searchUser.profilePicture || "https://via.placeholder.com/40"}
                          alt={searchUser.username}
                          className="w-10 h-10 rounded-full object-cover border-2 border-mono-200 dark:border-mono-700"
                        />
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-mono-black dark:text-mono-white">{searchUser.username}</p>
                          {searchUser.bio && (
                            <p className="text-sm text-mono-600 dark:text-mono-400 truncate">{searchUser.bio}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
