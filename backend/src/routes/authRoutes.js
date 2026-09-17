import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, forgotPasswordSchema } from "../validators/authValidator.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticateToken, authController.getCurrentUser);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

export default router;
