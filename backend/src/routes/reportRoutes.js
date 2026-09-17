import { Router } from "express";
import { reportController } from "../controllers/reportController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

router.get("/", reportController.getReports);

export default router;
