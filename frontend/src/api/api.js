import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL,
  baseURL: "http://localhost:3000/api/v1",
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Only redirect if not already on a public page
      const publicPaths = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
      const currentPath = window.location.pathname;

      if (!publicPaths.includes(currentPath)) {
        // Clear any stored user data
        localStorage.removeItem("user");

        // Redirect to login page
        window.location.href = "/login";
      }
    }

    // Return the login error to be handled by the calling function
    return Promise.reject(error);
  },
);

export default api;
