import { Router } from "express";
import { contractController } from "../controllers/contractController.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  contractCreateSchema,
  contractRenewSchema,
  contractStatusSchema
} from "../validators/contractValidator.js";

const router = Router();

router.use(authenticateToken);

router.get("/", contractController.getContracts);
router.get("/:id", contractController.getContractById);
router.post("/", validate(contractCreateSchema), contractController.createContract);
router.post("/:id/renew", validate(contractRenewSchema), contractController.renewContract);
router.patch("/:id/status", validate(contractStatusSchema), contractController.updateContractStatus);

export default router;
