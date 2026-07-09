import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Schema } = mongoose;

const notificationPreferencesSchema = new Schema(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    chatMessage: { type: Boolean, default: true },
    mentorSession: { type: Boolean, default: true },
    mentorResource: { type: Boolean, default: true },
    mentorAssignment: { type: Boolean, default: true },
    adminUpdate: { type: Boolean, default: true },
    reportUpdate: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student",
    },
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "active",
    },
    lastLoginAt: {
      type: Date,
    },
    resetPasswordTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.statics.hashResetToken = function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

export default mongoose.model("User", userSchema);
