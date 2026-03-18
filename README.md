# 📱 Social Media Platform

Full-stack MERN social app with authentication, posts, comments, follows, notifications, and real-time messaging using Socket.IO.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

## ✨ Current Features

- Email OTP-based signup verification
- JWT auth using HTTP-only cookies
- Forgot/reset password via OTP email
- Profile edit (bio + profile picture upload)
- Follow/unfollow users
- Suggested users and user search
- Create posts with image upload (Cloudinary)
- Like/unlike, comment, save/unsave posts
- Real-time notifications (like/comment/follow)
- Real-time 1:1 messaging (text + image)
- Typing indicators and message seen status
- Dark mode + responsive UI

---

## 🛠 Tech Stack

### Frontend

- React 18 + Vite
- React Router v6
- Tailwind CSS
- TanStack Query
- Axios
- Socket.IO Client
- Framer Motion

### Backend

- Node.js + Express 5
- MongoDB + Mongoose
- JWT + bcryptjs
- Multer + Sharp + Cloudinary
- Nodemailer + EJS templates
- Socket.IO
- Security middleware: `helmet`, `express-mongo-sanitize`, `express-rate-limit`

---

## 🚀 Getting Started

## 1) Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail app password (or SMTP credentials)

## 2) Install Dependencies

```bash
# from project root
cd backend && npm install
cd ../frontend && npm install
```

## 3) Environment Setup

### Backend

Copy `backend/.env.example` to `backend/.env` and fill values:

```env
NODE_ENV=development
PORT=8000
DB_URL=mongodb://localhost:27017/social-media

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

FRONTEND_URL=http://localhost:5173
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

> Note: API base URL is currently hardcoded in `frontend/src/api/api.js` as `http://localhost:3000/api/v1`.

## 4) Run the App

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API (if `PORT=3000`): `http://localhost:3000/api/v1`
- Health check: `http://localhost:3000/check`

---

## 📚 API Reference

Base: `/api/v1`

### Auth Routes (`/auth`)

| Method | Endpoint                | Auth | Description             |
| ------ | ----------------------- | ---- | ----------------------- |
| POST   | `/auth/signup`          | ❌   | Register new user       |
| POST   | `/auth/login`           | ❌   | Login                   |
| POST   | `/auth/verify`          | ❌   | Verify email OTP        |
| POST   | `/auth/resend-otp`      | ❌   | Resend verification OTP |
| POST   | `/auth/forget-password` | ❌   | Request reset OTP       |
| POST   | `/auth/reset-password`  | ❌   | Reset password with OTP |
| POST   | `/auth/logout`          | ✅   | Logout user             |

### User Routes (`/users`) - protected

| Method | Endpoint                 | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/users/me`              | Current logged-in user       |
| GET    | `/users/search`          | Search users (`query` param) |
| GET    | `/users/profile/:id`     | Get profile by user id       |
| GET    | `/users/suggested-users` | Suggested users              |
| POST   | `/users/follow/:id`      | Follow user                  |
| POST   | `/users/unfollow/:id`    | Unfollow user                |
| POST   | `/users/edit-profile`    | Edit profile (multipart)     |

### Post Routes (`/posts`) - protected

| Method | Endpoint                      | Description                    |
| ------ | ----------------------------- | ------------------------------ |
| GET    | `/posts/all-posts`            | Feed (supports `page`,`limit`) |
| GET    | `/posts/user-posts/:id`       | Posts by user                  |
| GET    | `/posts/:postId/comments`     | Post comments                  |
| POST   | `/posts/create-post`          | Create post (multipart)        |
| POST   | `/posts/save/:postId`         | Save/unsave post               |
| POST   | `/posts/like-dislike/:postId` | Like/unlike post               |
| POST   | `/posts/comment/:postId`      | Add comment                    |
| DELETE | `/posts/delete/:postId`       | Delete own post                |

### Message Routes (`/messages`) - protected

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | `/messages/conversations` | List conversations         |
| GET    | `/messages/:userId`       | Chat with specific user    |
| GET    | `/messages/unread/count`  | Unread message count       |
| POST   | `/messages/send`          | Send message (multipart)   |
| PATCH  | `/messages/:userId/seen`  | Mark chat messages as seen |

### Notification Routes (`/notifications`) - protected

| Method | Endpoint                       | Description                |
| ------ | ------------------------------ | -------------------------- |
| GET    | `/notifications`               | List notifications         |
| GET    | `/notifications/unread-count`  | Unread notification count  |
| PATCH  | `/notifications/mark-all-read` | Mark all as read           |
| PATCH  | `/notifications/:id/read`      | Mark one notification read |
| DELETE | `/notifications/:id`           | Delete notification        |

---

## 🔌 Socket.IO Events

### Client emits

- `user-connected` (userId)
- `typing` ({ senderId, receiverId })
- `stopTyping` ({ senderId, receiverId })

### Server emits

- `new-notification`
- `newPost`
- `message` (payload includes `newMessage` / `messagesSeen` types)
- `userTyping`
- `userStoppedTyping`
- `postLikeUpdated`
- `newComment`
- `postSavedUpdated`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

Required:

- `NODE_ENV`
- `PORT`
- `DB_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL`

### Frontend (`frontend/.env`)

- `VITE_API_URL` (currently not used by `api.js`)
- `VITE_SOCKET_URL`

---

## 📁 Project Structure

```text
social/
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── views/emails/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── public/
└── README.md
```

---

## 🧪 Testing

No automated test suite is configured yet.

Suggested:

- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library

---

## 🤝 Contributing

1. Fork the repo
2. Create branch: `feature/your-feature-name`
3. Commit and push
4. Open a pull request

---

## 📝 License

ISC
