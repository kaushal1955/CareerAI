import { Router } from "express";
import {
  forgotPassword,
  getSessionStatus,
  login,
  register,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/session", protect, getSessionStatus);

export default router;
