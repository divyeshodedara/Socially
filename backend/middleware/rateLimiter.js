import { ipKeyGenerator, rateLimit } from "express-rate-limit";

// Reusable rate limiter factory function
const createRateLimiter = (
  windowMs,
  max,
  message = "Too many attempts. Please try again later.",
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = req.ip || req.remoteAddress;
      if (req.user?.id) {
        return req.user.id;
      }
      return ipKeyGenerator(ip);
    },
    handler: (req, res) => {
      res.status(429).json({
        status: "fail",
        message,
      });
    },
  });
};

// General API rate limiter - 500 requests per 15 minutes
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000,
  300,
  "Too many requests. Please try again later.",
);

// Strict limiter for auth routes - 5 requests per 15 minutes
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5);

// Login limiter - 5 requests per 15 minutes
export const loginLimiter = createRateLimiter(15 * 60 * 1000, 5);

// Password reset limiter - 3 requests per hour
export const passwordResetLimiter = createRateLimiter(60 * 60 * 1000, 3);

// Post creation limiter - 10 posts per hour
export const postCreationLimiter = createRateLimiter(60 * 60 * 1000, 10);

// Message limiter - 50 messages per 15 minutes
export const messageLimiter = createRateLimiter(15 * 60 * 1000, 50);

// Email verification limiter - 3 requests per hour
export const emailVerificationLimiter = createRateLimiter(60 * 60 * 1000, 3);
