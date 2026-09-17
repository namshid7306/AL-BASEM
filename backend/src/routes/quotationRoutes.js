import { Router } from "express";
import { quotationController } from "../controllers/quotationController.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { quotationCreateSchema } from "../validators/quotationValidator.js";

const router = Router();

router.use(authenticateToken);

router.get("/", quotationController.getQuotations);
router.get("/:id", quotationController.getQuotationById);
router.post("/", validate(quotationCreateSchema), quotationController.createQuotation);
router.post("/:id/convert-to-invoice", quotationController.convertToInvoice);

export default router;
