import express from "express";
import authController from "../controllers/auth.controller"

const router=express.Router();

router.post("/register",authController.register)
router.post("/login",authController.login)
router.get("/me",authController.me)
router.post("/activation",authController.activation)

export default router;