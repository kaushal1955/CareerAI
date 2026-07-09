import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../services/notificationService.js";

const allowedRoles = ["student", "mentor", "admin"];

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    res.status(404);
    throw new Error("User record not found.");
  }

  res.status(200).json({ success: true, user });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!allowedRoles.includes(role)) {
    res.status(400);
    throw new Error("Invalid role. Allowed roles: student, mentor, admin.");
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { role },
    { new: true, runValidators: true },
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  await createNotification({
    userId: user._id,
    type: "admin_update",
    title: "Account role updated",
    message: `Your CareerAI role has been changed to ${role}.`,
    link: "/dashboard",
    metadata: { role },
  });

  res.status(200).json({
    success: true,
    message: "User role updated successfully.",
    user,
  });
});
