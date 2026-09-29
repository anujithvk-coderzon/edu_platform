import type { Request, Response } from "express";
import { BadRequestError } from "../../../errors/Errors";
import { fetchPdfService } from "./media.service";

const allowCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
};

export const pdfPreflight = (_req: Request, res: Response) => {
  allowCors(res);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Range");
  return res.status(200).send();
};

export const proxyPdf = async (req: Request, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    throw new BadRequestError("PDF URL is required");
  }

  const pdf = await fetchPdfService(url);

  allowCors(res);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.send(pdf);
};
