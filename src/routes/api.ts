import express from "express";
import authController from "../controllers/auth.controller";
import transactionController from "../controllers/transaction.controller";
import aiController from "../controllers/ai.controller";
import dashboardController from "../controllers/dashboard.controller";
import financialProfileController from "../controllers/financial-profile.controller";
import budgetController from "../controllers/budget.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = express.Router();

// Auth Routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);
router.post("/auth/activation", authController.activation);

// Transaction Routes
router.post("/transactions", authMiddleware, transactionController.create);
router.get("/transactions", authMiddleware, transactionController.findAll);
router.get("/transactions/:id", authMiddleware, transactionController.findOne);
router.put("/transactions/:id", authMiddleware, transactionController.update);
router.delete("/transactions/:id", authMiddleware, transactionController.remove);

// AI wrapper routes
router.get("/ai/valid-values", aiController.getValidValues);
router.get("/ai/model-info", aiController.getModelInfo);
router.post("/ai/finbot-chat", authMiddleware, aiController.askFinBotChat);
router.post("/ai/behavior", authMiddleware, aiController.getBehavior);
router.post("/ai/rekomendasi", authMiddleware, aiController.getRekomendasi);

// Dashboard Routes
router.get("/dashboard/summary", authMiddleware, dashboardController.getSummary);
router.get("/dashboard/category-breakdown", authMiddleware, dashboardController.getCategoryBreakdown);
router.get("/dashboard/monthly", authMiddleware, dashboardController.getMonthlyData);
router.get("/dashboard/recent-transactions", authMiddleware, dashboardController.getRecentTransactions);

// Financial Profile Routes
router.get("/financial-profile", authMiddleware, financialProfileController.getProfile);
router.put("/financial-profile", authMiddleware, financialProfileController.updateProfile);

// Budget Routes
router.post("/budgets", authMiddleware, budgetController.create);
router.get("/budgets", authMiddleware, budgetController.findAll);
router.get("/budgets/status", authMiddleware, budgetController.getStatus);
router.get("/budgets/:id", authMiddleware, budgetController.findOne);
router.put("/budgets/:id", authMiddleware, budgetController.update);
router.delete("/budgets/:id", authMiddleware, budgetController.remove);

export default router;