import express from "express";
import { authMiddleware } from "../../../middlewares/auth";
import { createOrder, verifyPayment } from "./payments.controller";

const router=express.Router();

router.post("/order",authMiddleware,createOrder);
router.post("/verify", authMiddleware, verifyPayment);

export default router;