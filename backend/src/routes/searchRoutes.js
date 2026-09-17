import { Router } from "express";
import { searchController } from "../controllers/searchController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

router.get("/", searchController.search);

export default router;
