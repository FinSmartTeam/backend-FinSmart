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


export default router;