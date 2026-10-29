"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaymentService = exports.fulfilPayment = exports.createOrderService = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const razorPay_1 = require("../../../lib/razorPay");
const Errors_1 = require("../../../errors/Errors");
const createOrderService = async (studentId, courseId) => {
    const course = await prisma_1.default.course.findFirst({
        where: { id: courseId, status: "PUBLISHED", isPublic: true },
        select: { id: true, title: true, price: true },
    });
    if (!course)
        throw new Errors_1.NotFoundError("Course not found or not available for enrollment");
    if (course.price <= 0)
        throw new Errors_1.BadRequestError("This course is free. You can enroll without payment.");
    const existing = await prisma_1.default.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } }
    });
    if (existing)
        throw new Errors_1.BadRequestError("Already enrolled in this course");
    const amount = Math.round(course.price * 100);
    const order = await (0, razorPay_1.razorpay)().orders.create({
        amount,
        currency: "INR",
        receipt: `course_${courseId.slice(-10)}_${Date.now()}`,
        notes: { studentId, courseId }
    });
    await prisma_1.default.payment.create({
        data: {
            studentId,
            courseId,
            amount,
            currency: "INR",
            status: "CREATED",
            razorpayOrderId: order.id,
        }
    });
    return {
        orderId: order.id,
        amount,
        currency: "INR",
        courseTitle: course.title,
        keyId: process.env.RAZORPAY_KEY_ID
    };
};
exports.createOrderService = createOrderService;
const fulfilPayment = async (paymentId, razorpayPaymentId, signature) => {
    return prisma_1.default.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            throw new Errors_1.NotFoundError("Payment not found.");
        if (payment.status === "PAID") {
            return { enrolled: true, alreadyProcessed: true };
        }
        await tx.payment.update({
            where: { id: paymentId },
            data: { status: "PAID", razorpayPaymentId, razorpaySignature: signature },
        });
        await tx.enrollment.upsert({
            where: {
                studentId_courseId: { studentId: payment.studentId, courseId: payment.courseId },
            },
            update: {},
            create: {
                studentId: payment.studentId,
                courseId: payment.courseId,
                status: "ACTIVE",
                progressPercentage: 0
            },
        });
        return { enrolled: true, alreadyProcessed: false };
    });
};
exports.fulfilPayment = fulfilPayment;
const verifyPaymentService = async (studentId, input) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;
    if (!(0, razorPay_1.isValidPaymentSignature)(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        await prisma_1.default.payment.updateMany({
            where: { razorpayOrderId: razorpay_order_id, studentId },
            data: { status: "FAILED" }
        });
        throw new Errors_1.BadRequestError("Payment verification failed");
    }
    const payment = await prisma_1.default.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
    });
    if (!payment)
        throw new Errors_1.NotFoundError("Payment record not found");
    if (payment.studentId !== studentId)
        throw new Errors_1.BadRequestError("Unauthorized access to payment record");
    const charged = await (0, razorPay_1.razorpay)().payments.fetch(razorpay_payment_id);
    if (charged.order_id !== razorpay_order_id)
        throw new Errors_1.BadRequestError("Invalid payment record");
    if (charged.status !== "captured") {
        await prisma_1.default.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED", failureReason: `Razorpay status: ${charged.status}` }
        });
        throw new Errors_1.BadRequestError("Payment was not completed.");
    }
    if (Number(charged.amount) !== payment.amount) {
        throw new Errors_1.BadRequestError("Paid amount does not match the course price.");
    }
    return (0, exports.fulfilPayment)(payment.id, razorpay_payment_id, razorpay_signature);
};
exports.verifyPaymentService = verifyPaymentService;
