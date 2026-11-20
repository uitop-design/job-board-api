import express, { type Express } from "express";
import { companiesRouter } from "./routes/companies.js";
import { jobsRouter } from "./routes/jobs.js";

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/companies", companiesRouter);
  app.use("/jobs", jobsRouter);

  return app;
}
