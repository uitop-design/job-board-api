import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../errors.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

// Express 5 forwards rejected promises from async handlers here.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.flatten() });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Malformed JSON body" });
    return;
  }
  if (err?.code === "23505") {
    res.status(409).json({ error: "Resource already exists" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
