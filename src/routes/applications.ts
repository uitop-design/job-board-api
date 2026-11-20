import { Router } from "express";
import { db } from "../db.js";
import { applicationSchema } from "../validation.js";

export const applicationsRouter = Router({ mergeParams: true });

type Params = { jobId: string };

applicationsRouter.post<Params>("/", async (req, res) => {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const job = await db("jobs").where({ id: Number(req.params.jobId) }).first("id", "status");
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.status !== "open") {
    res.status(409).json({ error: "Job is closed" });
    return;
  }

  const duplicate = await db("applications").where({ job_id: job.id, email: parsed.data.email }).first("id");
  if (duplicate) {
    res.status(409).json({ error: "You have already applied to this job" });
    return;
  }

  const [application] = await db("applications")
    .insert({ ...parsed.data, job_id: job.id })
    .returning(["id", "job_id", "name", "email", "created_at"]);
  res.status(201).json(application);
});

applicationsRouter.get<Params>("/", async (req, res) => {
  res.json(await db("applications").where({ job_id: Number(req.params.jobId) }).orderBy("created_at", "desc"));
});
