"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../../middlewares/auth");
const payments_controller_1 = require("./payments.controller");
const router = express_1.default.Router();
router.post("/order", auth_1.authMiddleware, payments_controller_1.createOrder);
router.post("/verify", auth_1.authMiddleware, payments_controller_1.verifyPayment);
exports.default = router;
