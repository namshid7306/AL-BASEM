import { Router } from "express";
import { serviceController } from "../controllers/serviceController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { serviceCreateSchema, serviceUpdateSchema } from "../validators/serviceValidator.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticateToken);

router.get("/", serviceController.getServices);
router.get("/:id", serviceController.getServiceById);
router.post("/", validate(serviceCreateSchema), serviceController.createService);
router.put("/:id", validate(serviceUpdateSchema), serviceController.updateService);
router.delete("/:id", requireRole([ROLES.ADMIN]), serviceController.deleteService);

export default router;
