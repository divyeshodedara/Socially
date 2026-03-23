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
    <nav className="bg-mono-white dark:bg-mono-black border-b border-mono-200 dark:border-mono-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to="/" className="text-2xl font-bold text-mono-black dark:text-mono-white">
            Socially.
          </NavLink>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs mx-8" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mono-500 dark:text-mono-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full pl-10 pr-4 py-2 bg-mono-50 dark:bg-mono-900 border border-mono-200 dark:border-mono-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-mono-black dark:focus:ring-mono-white text-sm"
              />

              {showResults && searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-mono-white dark:bg-mono-900 border border-mono-200 dark:border-mono-700 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-3 text-center text-sm">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-center text-sm">No users found</div>
                  ) : (
                    <div className="py-1">
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser._id}
                          onClick={() => handleUserClick(searchUser._id)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-mono-50 dark:hover:bg-mono-800"
                        >
                          <img
                            src={searchUser.profilePicture || "https://via.placeholder.com/40"}
                            alt={searchUser.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="text-left">
                            <p className="font-semibold text-sm">{searchUser.username}</p>
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
          <div className="flex items-center space-x-5">
            <DarkModeToggle />
            <NavLink
              to="/"
              className={({ isActive }) =>
                `p-2 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 ${
                  isActive
                    ? "text-mono-black dark:text-mono-white bg-mono-100 dark:bg-mono-800"
                    : "text-mono-500 dark:text-mono-400"
                }`
              }
            >
              <Home className="w-6 h-6" />
            </NavLink>
            <button
              onClick={handleCreatePost}
              className="p-2 rounded-lg text-mono-500 dark:text-mono-400 hover:bg-mono-100 dark:hover:bg-mono-800 hover:text-mono-black dark:hover:text-mono-white"
            >
              <PlusSquare className="w-6 h-6" />
            </button>
            <MessageIcon />
            <NotificationBell />
            <NavLink
              to={`/profile/${user?._id}`}
              className={({ isActive }) =>
                `p-2 rounded-lg hover:bg-mono-100 dark:hover:bg-mono-800 ${
                  isActive
                    ? "text-mono-black dark:text-mono-white bg-mono-100 dark:bg-mono-800"
                    : "text-mono-500 dark:text-mono-400"
                }`
              }
            >
              <User className="w-6 h-6" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
