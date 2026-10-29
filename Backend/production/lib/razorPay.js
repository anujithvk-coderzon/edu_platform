"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidWebhookSignature = exports.isValidPaymentSignature = exports.razorpay = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const razorpay_utils_1 = require("razorpay/dist/utils/razorpay-utils");
const Errors_1 = require("../errors/Errors");
let client = null;
const razorpay = () => {
    if (client)
        return client;
    const keyI_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyI_id || !key_secret)
        throw new Error("Razorpay keys are not set in environment variables");
    client = new razorpay_1.default({
        key_id: keyI_id,
        key_secret: key_secret
    });
    return client;
};
exports.razorpay = razorpay;
const isValidPaymentSignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret)
        throw new Error("Razorpay secret is not set in environment variables");
    return (0, razorpay_utils_1.validatePaymentVerification)({
        order_id: orderId,
        payment_id: paymentId
    }, signature, secret);
};
exports.isValidPaymentSignature = isValidPaymentSignature;
const isValidWebhookSignature = (rawBody, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret)
        throw new Errors_1.InternalServerError("Webhook secret is not configured.");
    return (0, razorpay_utils_1.validateWebhookSignature)(rawBody.toString(), signature, secret);
};
exports.isValidWebhookSignature = isValidWebhookSignature;
