"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createOrder = void 0;
const payments_validation_1 = require("./payments.validation");
const payments_service_1 = require("./payments.service");
const createOrder = async (req, res) => {
    const userId = req.user?.id;
    const validated = payments_validation_1.createOrderSchema.safeParse(req.body);
    if (!validated.success)
        throw validated.error;
    const data = await (0, payments_service_1.createOrderService)(userId, validated.data.courseId);
    return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data
    });
};
exports.createOrder = createOrder;
const verifyPayment = async (req, res) => {
    const userId = req.user?.id;
    const parsed = payments_validation_1.verifyPaymentSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, payments_service_1.verifyPaymentService)(userId, parsed.data);
    return res.json({ success: true, data });
};
exports.verifyPayment = verifyPayment;
