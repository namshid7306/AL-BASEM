import { Router } from "express";
import { settingsController } from "../controllers/settingsController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { settingsUpdateSchema } from "../validators/settingsValidator.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticateToken);

router.get("/", settingsController.getSettings);
router.put("/", requireRole([ROLES.ADMIN]), validate(settingsUpdateSchema), settingsController.updateSettings);

export default router;
