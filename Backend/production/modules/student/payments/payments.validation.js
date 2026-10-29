"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentSchema = exports.createOrderSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createOrderSchema = zod_1.default.object({
    courseId: zod_1.default.string().min(1, "Course ID is required"),
});
exports.verifyPaymentSchema = zod_1.default.object({
    razorpay_order_id: zod_1.default.string().min(1, "Order ID is required"),
    razorpay_payment_id: zod_1.default.string().min(1, "Payment ID is required"),
    razorpay_signature: zod_1.default.string().min(1, "Signature is required"),
});
