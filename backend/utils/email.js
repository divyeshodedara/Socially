import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
});

async function sendOtpEmail(options) {
  const templatePath = path.join(process.cwd(), "views", "emails", "otp.ejs");

  const data = {
    appName: "Socially",
    userName: options.user.username,
    otp: options.otp,
    purpose: options.purpose || "verify your email",
    expiryMinutes: options.user.otpExpiry ? Math.round((options.user.otpExpiry - Date.now()) / 60000) : 10,
    supportEmail: "divyeshodedara1012@gmail.com",
    year: new Date().getFullYear(),
  };

  // Render template with dynamic data
  const html = await ejs.renderFile(templatePath, data);

  // Send email
  await transporter.sendMail({
    from: `"Socially" <no-reply@pulse.app>`,
    to: options.user.email,
    subject: `Your OTP for ${data.appName}`,
    html,
  });

  return data.otp;
}

export default sendOtpEmail;
