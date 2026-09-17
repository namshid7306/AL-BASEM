import { Router } from "express";
import { invoiceController } from "../controllers/invoiceController.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { invoiceCreateSchema } from "../validators/invoiceValidator.js";

const router = Router();

router.use(authenticateToken);

router.get("/", invoiceController.getInvoices);
router.get("/:id", invoiceController.getInvoiceById);
router.post("/", validate(invoiceCreateSchema), invoiceController.createInvoice);

export default router;
