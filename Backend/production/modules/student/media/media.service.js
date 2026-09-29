"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPdfService = void 0;
const axios_1 = __importDefault(require("axios"));
const Errors_1 = require("../../../errors/Errors");
const mediaHosts_1 = require("../../../lib/mediaHosts");
const FETCH_TIMEOUT_MS = 30000;
/**
 * Fetch a PDF on the client's behalf so react-pdf is not blocked by CORS.
 *
 * Only this deployment's own media hosts are fetched — an open proxy here
 * would be an SSRF primitive against the server's network, and a substring
 * host check would leak the storage key to an attacker-controlled host.
 */
const fetchPdfService = async (rawUrl) => {
    const target = (0, mediaHosts_1.parseAllowedMediaUrl)(rawUrl);
    if (!target) {
        throw new Errors_1.BadRequestError("Invalid PDF URL");
    }
    const headers = { Accept: "application/pdf" };
    // The access key goes ONLY to Bunny Storage, matched on exact hostname.
    if (target.hostname.toLowerCase() === mediaHosts_1.BUNNY_STORAGE_HOST) {
        const accessKey = process.env.BUNNY_STORAGE_ACCESS_KEY;
        if (accessKey)
            headers.AccessKey = accessKey;
    }
    const response = await axios_1.default.get(target.toString(), {
        responseType: "arraybuffer",
        headers,
        timeout: FETCH_TIMEOUT_MS,
    });
    return response.data;
};
exports.fetchPdfService = fetchPdfService;
