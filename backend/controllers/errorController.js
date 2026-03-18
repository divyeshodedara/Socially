// // controllers/errorController.js
// import AppError from "../utils/appError.js";

// // Handle cast errors (invalid MongoDB ObjectId)
// const handleCastErrorDB = (err) => {
//   const message = `Invalid ${err.path}: ${err.value}.`;
//   return new AppError(message, 400);
// };

// // Handle duplicate field errors (MongoDB E11000)
// const handleDuplicateFieldsDB = (err) => {
//   const value = err.keyValue ? JSON.stringify(err.keyValue) : "duplicate field";
//   const message = `Duplicate field value: ${value}. Please use another value!`;
//   return new AppError(message, 400);
// };

// // Handle validation errors from Mongoose
// const handleValidationErrorDB = (err) => {
//   const errors = Object.values(err.errors).map((el) => el.message);
//   const message = `Invalid input data. ${errors.join(". ")}`;
//   return new AppError(message, 400);
// };

// // Error for JWT invalid
// const handleJWTError = () =>
//   new AppError("Invalid token. Please log in again!", 401);

// // Error for JWT expired
// const handleJWTExpiredError = () =>
//   new AppError("Your token has expired! Please log in again.", 401);

// const sendErrorDev = (err, req, res) => {
//   res.status(err.statusCode).json({
//     status: err.status,
//     error: err,
//     message: err.message,
//     stack: err.stack,
//   });
// };

// const sendErrorProd = (err, req, res) => {
//   // Operational, trusted error: send message to client
//   if (err.isOperational) {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//     });
//   } else {
//     // Programming or unknown error: don't leak details
//     console.error("❌ ERROR:", err);
//     res.status(500).json({
//       status: "error",
//       message: "Something went very wrong!",
//     });
//   }
// };

// const globalErrorHandler = (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || "error";

//   if (process.env.NODE_ENV === "development") {
//     sendErrorDev(err, req, res);
//   } else if (process.env.NODE_ENV === "production") {
//     let error = { ...err };
//     error.message = err.message;

//     if (err.name === "CastError") error = handleCastErrorDB(err);
//     if (err.code === 11000) error = handleDuplicateFieldsDB(err);
//     if (err.name === "ValidationError") error = handleValidationErrorDB(err);
//     if (err.name === "JsonWebTokenError") error = handleJWTError();
//     if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

//     sendErrorProd(error, req, res);
//   }
// };

// export default globalErrorHandler;

const errorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  const firstLine = err.stack?.split("\n")[1]?.trim();
  res.status(err.statusCode).json({
    statusCode: err.statusCode,
    status: err.status,
    message: err.message,
    // stack: err.stack,
    stack: firstLine,
  });
};

export default errorController;
