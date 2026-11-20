import { Router } from "express";
import { conflict, idParam, notFound } from "../errors.js";
import { applicationSchema } from "../validation.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { config } from "../config.js";
import { findJobStatus } from "../repositories/jobs.js";
import { createApplication, hasApplied, listApplications } from "../repositories/applications.js";

export const applicationsRouter = Router({ mergeParams: true });

type Params = { jobId: string };

applicationsRouter.post<Params>("/", rateLimit({ prefix: "apply", ...config.applyRateLimit }), async (req, res) => {
  const data = applicationSchema.parse(req.body);

  const job = await findJobStatus(idParam(req.params.jobId));
  if (!job) throw notFound("Job");
  if (job.status !== "open") throw conflict("Job is closed");
  if (await hasApplied(job.id, data.email)) throw conflict("You have already applied to this job");

  res.status(201).json(await createApplication(job.id, data));
});

applicationsRouter.get<Params>("/", async (req, res) => {
  res.json(await listApplications(idParam(req.params.jobId)));
});
