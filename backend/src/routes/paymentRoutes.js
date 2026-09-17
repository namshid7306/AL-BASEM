import { Router } from "express";
import { paymentController } from "../controllers/paymentController.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { handleIdempotency } from "../middleware/idempotency.js";
import { paymentRecordSchema } from "../validators/paymentValidator.js";

const router = Router();

router.use(authenticateToken);

router.get("/", paymentController.getPayments);
router.post("/", handleIdempotency, validate(paymentRecordSchema), paymentController.recordPayment);

export default router;
