import { ZodError } from "zod";
import { MulterError } from "multer";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

/**
 * Central error handler. Controllers throw; Express 5 forwards rejected
 * promises here automatically, so handlers need no try/catch of their own.
 *
 * The `{ success, error: { message } }` envelope is API contract — both
 * frontends branch on `success` and render `error.message` — so it is kept
 * byte-identical to what the previous handlers produced.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Typed application errors carry their own status.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: err.message },
    });
  }

  // Validation. `details` mirrors the express-validator shape the frontends
  // already handle, so nothing downstream needs to change.
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      param: issue.path.join("."),
      msg: issue.message,
    }));
    return res.status(400).json({
      success: false,
      error: { message: "Validation failed", details },
    });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large."
        : err.code === "LIMIT_FILE_COUNT"
          ? "Too many files in this request."
          : err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Unexpected file, or too many files"
            : "File upload failed";
    return res.status(400).json({ success: false, error: { message } });
  }

  // Prisma errors are matched by shape, not `instanceof`: the generated client
  // and any other copy of @prisma/client are separate module instances, so an
  // identity check silently fails and every DB fault becomes a bare 500.
  const prismaCode: string | undefined =
    typeof err?.code === "string" && /^P\d{4}$/.test(err.code) ? err.code : undefined;

  if (prismaCode) {
    // Connection faults are not the caller's fault and are not permanent.
    if (["P1000", "P1001", "P1002", "P1008", "P1017"].includes(prismaCode)) {
      console.error(`Database unavailable (${prismaCode}) on ${req.method} ${req.path}`);
      return res.status(503).json({
        success: false,
        error: { message: "The database is unreachable. Please try again shortly." },
      });
    }

    const known: Record<string, { status: number; message: string }> = {
      P2002: { status: 400, message: "Record already exists" },
      P2025: { status: 404, message: "Record not found" },
      P2003: { status: 400, message: "Foreign key constraint failed" },
      P2021: { status: 503, message: "The database is not ready. Please try again shortly." },
    };
    const hit = known[prismaCode];
    if (hit) {
      return res.status(hit.status).json({
        success: false,
        error: { message: hit.message },
      });
    }

    console.error(`Prisma error ${prismaCode} on ${req.method} ${req.path}:`, err?.message);
    return res
      .status(400)
      .json({ success: false, error: { message: "Database error" } });
  }

  if (err?.name === "PrismaClientValidationError") {
    return res
      .status(400)
      .json({ success: false, error: { message: "Invalid data provided" } });
  }

  // Legacy handlers set `status` or `statusCode` on plain errors; honour both.
  const statusCode = err?.statusCode || err?.status || 500;

  console.error("Server error:", {
    message: err?.message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: err?.stack,
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? "Internal server error" : err?.message,
      ...(process.env.NODE_ENV === "development" && { stack: err?.stack }),
    },
  });
};
