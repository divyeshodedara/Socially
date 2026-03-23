import path from "path";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import express from "express";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import authRouter from "./routes/authRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Trust proxy to get correct client IP
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
// app.use(mongoSanitize());
app.use("/", express.static("uploads"));
app.use(express.static(path.join(process.cwd(), "public")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Apply rate limiting to all API routes
// app.use("/api/v1", apiLimiter);

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/auth", authRouter);

//health check
app.get("/check", (req, res, next) => {
  res.status(200).json({ message: "API is working!" });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
