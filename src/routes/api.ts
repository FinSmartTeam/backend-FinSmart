import express from "express";
import authController from "../controllers/auth.controller";
import transactionController from "../controllers/transaction.controller";
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

export default router;