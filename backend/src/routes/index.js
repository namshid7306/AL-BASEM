import { Router } from "express";
import authRoutes from "./authRoutes.js";
import customerRoutes from "./customerRoutes.js";
import serviceRoutes from "./serviceRoutes.js";
import contractRoutes from "./contractRoutes.js";
import invoiceRoutes from "./invoiceRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import quotationRoutes from "./quotationRoutes.js";
import expenseRoutes from "./expenseRoutes.js";
import reportRoutes from "./reportRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import searchRoutes from "./searchRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import settingsRoutes from "./settingsRoutes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/customers", customerRoutes);
apiRouter.use("/services", serviceRoutes);
apiRouter.use("/contracts", contractRoutes);
apiRouter.use("/invoices", invoiceRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/quotations", quotationRoutes);
apiRouter.use("/expenses", expenseRoutes);
apiRouter.use("/reports", reportRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/search", searchRoutes);
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/", uploadRoutes); // /upload and /uploads/:fileId

export default apiRouter;
