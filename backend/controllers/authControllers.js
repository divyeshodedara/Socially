import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import generateOTP from "../utils/generateOtp.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import sendOtpEmail from "../utils/email.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res, message) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "development" ? false : true,
  };

  res.cookie("token", token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.otp = undefined;
  user.otpExpiry = undefined;

  res.status(statusCode).json({
    status: "success",
    message,
    data: { user },
  });
};

const signup = catchAsync(async (req, res, next) => {
  const { username, email, password, passwordConfirm } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new AppError("User already exists", 400));
  }

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  const newUser = await User.create({
    username,
    email,
    password,
    passwordConfirm,
    otp,
    otpExpiry,
  });

  try {
    await sendOtpEmail({
      user: newUser,
      otp: otp,
      purpose: "verify your email",
    });

    res.status(201).json({
      status: "success",
      message: "email sent to the user",
    });
  } catch (err) {
    console.error("Email error:", err.message);
    await User.findByIdAndDelete(newUser._id);
    return next(new AppError("There was an error sending the email. Please try again later.", 500));
  }
});

const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError("Email and OTP are required", 400));
  }

  const user = await User.findOne({
    email,
    otp,
    otpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Invalid or expired OTP", 400));
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save({ validateBeforeSave: false });
  sendToken(user, 200, res, "Email verified successfully!");
});

const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isVerified) {
    return next(new AppError("User is already verified", 400));
  }

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000;
  user.otp = otp;
  user.otpExpiry = otpExpiry;

  await user.save({ validateBeforeSave: false });

  try {
    const otpSent = await sendOtpEmail({
      user,
      otp,
      purpose: "verify your email",
    });
    console.log("OTP sent:", otpSent);
    res.status(200).json({
      status: "success",
      message: "OTP resent successfully",
    });
  } catch (err) {
    console.error("Email error:", err.message);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email. Please try again later.", 500));
  }
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password +isVerified +otp +otpExpiry");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  if (!user.isVerified) {
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    try {
      const otp = await sendOtpEmail(user);
      console.log("OTP sent:", otp);
      return next(new AppError("Email not verified. A new OTP has been sent to your email.", 401));
    } catch (err) {
      console.error("Email error:", err.message);
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError("There was an error sending the email. Please try again later.", 500));
    }
  }
  sendToken(user, 200, res, "Logged in successfully!");
});

const logout = catchAsync(async (req, res, next) => {
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
    secure: process.env.NODE_ENV === "development" ? false : true,
  });
  res.status(200).json({ status: "success", message: "Logged out successfully!" });
});

const forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000;

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpiry = otpExpiry;
  await user.save({ validateBeforeSave: false });
  try {
    // console.log("Preparing to send OTP email");
    const options = {
      user,
      otp,
      purpose: "reset your password",
    };
    // console.log("Sending OTP email with options:", options);
    const emailResponse = await sendOtpEmail(options);
    console.log("OTP sent:", emailResponse);
    res.status(200).json({
      status: "success",
      message: "OTP sent to email successfully",
    });
  } catch (err) {
    console.error("Email error:", err.message);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("There was an error sending the email. Please try again later.", 500));
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, password, passwordConfirm } = req.body;
  if (!email || !otp || !password || !passwordConfirm) {
    return next(new AppError("All fields are required", 400));
  }

  const user = await User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordOtpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("user does not exists or invalid OTP", 400));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpiry = undefined;

  await user.save();

  sendToken(user, 200, res, "Password reset succeffully! Please log in with your new password.");
});

export { signup, verifyOtp, resendOtp, login, logout, forgetPassword, resetPassword };
