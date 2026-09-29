"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyReview = exports.listCourseReviews = exports.submitReview = void 0;
const Errors_1 = require("../../../errors/Errors");
const reviews_service_1 = require("./reviews.service");
const reviews_validation_1 = require("./reviews.validation");
const studentId = (req) => {
    if (!req.user?.id) {
        throw new Errors_1.UnauthorizedError("Access denied. No token provided.");
    }
    return req.user.id;
};
const submitReview = async (req, res) => {
    const parsed = reviews_validation_1.submitReviewSchema.safeParse(req.body);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, reviews_service_1.submitReviewService)(studentId(req), parsed.data);
    return res.json({
        success: true,
        data,
        message: "Review submitted successfully",
    });
};
exports.submitReview = submitReview;
/** Public: anyone can read a course's reviews. */
const listCourseReviews = async (req, res) => {
    const parsed = reviews_validation_1.reviewQuerySchema.safeParse(req.query);
    if (!parsed.success)
        throw parsed.error;
    const data = await (0, reviews_service_1.listCourseReviewsService)(req.params.courseId, parsed.data);
    return res.json({ success: true, data });
};
exports.listCourseReviews = listCourseReviews;
const getMyReview = async (req, res) => {
    const data = await (0, reviews_service_1.getMyReviewService)(studentId(req), req.params.courseId);
    return res.json({ success: true, data });
};
exports.getMyReview = getMyReview;
