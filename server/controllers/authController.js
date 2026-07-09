import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";
import { sendPlatformEmail } from "../services/emailService.js";

const allowedRoles = ["student", "mentor", "admin"];

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  return obj;
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    res.status(409);
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    firstName: firstName || "",
    lastName: lastName || "",
    role: allowedRoles.includes(role) ? role : "student",
    lastLoginAt: new Date(),
  });

  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    token,
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash",
  );

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  if (user.status === "blocked") {
    res.status(403);
    throw new Error("This account has been blocked. Contact support.");
  }

  const match = await user.comparePassword(password);

  if (!match) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user._id);

  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    token,
    user: sanitizeUser(user),
  });
});

export const getSessionStatus = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    authenticated: Boolean(req.userId),
    userId: req.userId || null,
  });
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Always respond with success, whether or not the account exists,
  // so the endpoint can't be used to enumerate registered emails.
  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  };

  if (!user) {
    res.status(200).json(genericResponse);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = User.hashResetToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  const baseUrl =
    (process.env.CLIENT_URL || "").split(",")[0]?.trim() ||
    "http://localhost:5173";
  const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

  const emailResult = await sendPlatformEmail({
    to: user.email,
    subject: "CareerAI • Reset your password",
    text: `We received a request to reset your CareerAI password. This link expires in 1 hour: ${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <div style="background:#f8fafc;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;">
          <p style="margin:0 0 8px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">CareerAI</p>
          <h1 style="margin:0 0 16px;color:#0f172a;font-size:24px;">Reset your password</h1>
          <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">
            We received a request to reset your CareerAI password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block;margin-top:8px;padding:12px 18px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">Reset password</a>
          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  // If SMTP isn't configured (local dev), surface the link directly in the
  // API response so it's still usable without a mailbox.
  if (emailResult.skipped) {
    res.status(200).json({ ...genericResponse, devResetUrl: resetUrl });
    return;
  }

  res.status(200).json(genericResponse);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error("Token and new password are required.");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters.");
  }

  const tokenHash = User.hashResetToken(token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordTokenHash +resetPasswordExpires");

  if (!user) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired.");
  }

  user.passwordHash = await User.hashPassword(password);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({
    success: true,
    message:
      "Password reset successfully. You can now log in with your new password.",
  });
});
