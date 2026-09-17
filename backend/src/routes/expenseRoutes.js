import { Router } from "express";
import { expenseController } from "../controllers/expenseController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { expenseCreateSchema } from "../validators/expenseValidator.js";
import { ROLES } from "../config/constants.js";

const router = Router();

router.use(authenticateToken);

router.get("/", expenseController.getExpenses);
router.post("/", validate(expenseCreateSchema), expenseController.createExpense);
router.delete("/:id", requireRole([ROLES.ADMIN]), expenseController.deleteExpense);

export default router;
