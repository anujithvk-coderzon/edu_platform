"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyPdf = exports.pdfPreflight = void 0;
const Errors_1 = require("../../../errors/Errors");
const media_service_1 = require("./media.service");
const allowCors = (res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
};
const pdfPreflight = (_req, res) => {
    allowCors(res);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Range");
    return res.status(200).send();
};
exports.pdfPreflight = pdfPreflight;
const proxyPdf = async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
        throw new Errors_1.BadRequestError("PDF URL is required");
    }
    const pdf = await (0, media_service_1.fetchPdfService)(url);
    allowCors(res);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(pdf);
};
exports.proxyPdf = proxyPdf;
