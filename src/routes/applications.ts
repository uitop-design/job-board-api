import { Router } from "express";
import { db } from "../db.js";
import { conflict, idParam, notFound } from "../errors.js";
import { applicationSchema } from "../validation.js";

export const applicationsRouter = Router({ mergeParams: true });

type Params = { jobId: string };

applicationsRouter.post<Params>("/", async (req, res) => {
  const data = applicationSchema.parse(req.body);

  const job = await db("jobs").where({ id: idParam(req.params.jobId) }).first("id", "status");
  if (!job) throw notFound("Job");
  if (job.status !== "open") throw conflict("Job is closed");

  const duplicate = await db("applications").where({ job_id: job.id, email: data.email }).first("id");
  if (duplicate) throw conflict("You have already applied to this job");

  const [application] = await db("applications")
    .insert({ ...data, job_id: job.id })
    .returning(["id", "job_id", "name", "email", "created_at"]);
  res.status(201).json(application);
});

applicationsRouter.get<Params>("/", async (req, res) => {
  res.json(await db("applications").where({ job_id: idParam(req.params.jobId) }).orderBy("created_at", "desc"));
});
