import { Router } from "express";
import { customerController } from "../controllers/customerController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { customerCreateSchema, customerUpdateSchema } from "../validators/customerValidator.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticateToken);

router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomerById);
router.post("/", validate(customerCreateSchema), customerController.createCustomer);
router.put("/:id", validate(customerUpdateSchema), customerController.updateCustomer);
router.delete("/:id", requireRole([ROLES.ADMIN]), customerController.deleteCustomer);

export default router;
