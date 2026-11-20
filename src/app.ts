import express, { type Express } from "express";
import { companiesRouter } from "./routes/companies.js";
import { jobsRouter } from "./routes/jobs.js";
import { applicationsRouter } from "./routes/applications.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/companies", companiesRouter);
  app.use("/jobs", jobsRouter);
  app.use("/jobs/:jobId/applications", applicationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
