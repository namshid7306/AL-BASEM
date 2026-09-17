import { Router } from "express";
import { notificationController } from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
