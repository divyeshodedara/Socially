# Socially Application Architecture

This document describes the high-level architecture and technology stack of the **Socially** social media application.

## Overview

Socially is a full-stack social media platform featuring real-time interactions, post sharing, user profiles, and messaging. It follows a decoupled architecture with a React-based frontend and a Node.js/Express-based backend.

---

## Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **State Management & Data Fetching:** TanStack Query (React Query)
- **Styling:** Tailwind CSS, Framer Motion (Animations)
- **Routing:** React Router DOM
- **Icons:** Lucide React, React Icons
- **Real-time:** Socket.io-client
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express
- **Database:** MongoDB with Mongoose ODM
- **Real-time:** Socket.io
- **Authentication:** JWT (JSON Web Tokens) with HttpOnly cookies, Bcrypt for password hashing
- **File Uploads:** Multer & Cloudinary
- **Email:** Nodemailer with EJS templates
- **Security:** Helmet, HPP, Express-Mongo-Sanitize, Express-Rate-Limit

---

## System Components

### 1. Frontend Architecture (`/frontend`)
The frontend is organized by feature and common components.
- **`src/api/`**: Axios configuration and API service layers.
- **`src/components/`**: Divided into `auth`, `posts`, `profile`, and `common` (Layout, Navbar, Sidebar).
- **`src/context/`**: React Context providers for global state (Auth, Socket, Theme).
- **`src/pages/`**: Individual page views (Home, Profile, Chat, etc.).
- **`src/utils/`**: Helper functions.

### 2. Backend Architecture (`/backend`)
The backend follows a MVC-like pattern (Model-View-Controller, though Views are only for emails).
- **`models/`**: Mongoose schemas defining the data structure (Users, Posts, Comments, Messages, Notifications).
- **`controllers/`**: Business logic for handling requests and interacting with models.
- **`routes/`**: Express route definitions mapping URLs to controllers.
- **`middleware/`**: Custom middleware for authentication, error handling, and rate limiting.
- **`utils/`**: Utilities for Cloudinary, Socket.io initialization, and email sending.

### 3. Database Schema
- **User:** Handles authentication, profile info, followers/following, and saved posts.
- **Post:** Stores content, images (Cloudinary URLs), likes, and references to comments.
- **Comment:** Nested or flat comments on posts.
- **Message & Conversation:** Real-time chat data.
- **Notification:** User alerts for likes, follows, and comments.

---

## Core Workflows

### Authentication
1. User signs up/logs in via `authControllers`.
2. Backend generates a JWT and sends it back via a secure HttpOnly cookie.
3. Frontend's `AuthContext` tracks the user's state.
4. `ProtectedRoute` component ensures only authenticated users access private routes.

### Real-time Features
- Initialized via `SocketContext` on the frontend.
- Backend handles socket connections in `utils/socket.js`.
- Enables instant messaging, real-time notifications, and online status.

### Media Handling
- Images are uploaded via `multer` to a temporary memory buffer.
- Uploaded to **Cloudinary** for optimized storage and delivery.
- Cloudinary URLs are then stored in the MongoDB documents.

---

## Security Measures
- **Rate Limiting:** Prevents brute-force attacks on API endpoints.
- **Data Sanitization:** Protects against NoSQL injection.
- **Security Headers:** Implemented via `helmet`.
- **JWT in Cookies:** Mitigates XSS risks compared to LocalStorage.
