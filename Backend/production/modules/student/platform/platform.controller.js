"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformStats = void 0;
const platform_service_1 = require("./platform.service");
/** Public: platform-wide counters shown on the landing page. */
const getPlatformStats = async (_req, res) => {
    const data = await (0, platform_service_1.getPlatformStatsService)();
    return res.json({ success: true, data });
};
exports.getPlatformStats = getPlatformStats;
