import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

router.get("/", dashboardController.getDashboardData);

export default router;
