import type { Request, Response } from "express";
import { getPlatformStatsService } from "./platform.service";

/** Public: platform-wide counters shown on the landing page. */
export const getPlatformStats = async (_req: Request, res: Response) => {
  const data = await getPlatformStatsService();
  return res.json({ success: true, data });
};
