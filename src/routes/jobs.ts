import { Router } from "express";
import { HttpError, idParam, notFound } from "../errors.js";
import { jobQuerySchema, jobSchema, jobUpdateSchema } from "../validation.js";
import { closeJob, createJob, findJob, searchJobs, updateJob } from "../repositories/jobs.js";
import { companyExists } from "../repositories/companies.js";

export const jobsRouter = Router();

jobsRouter.get("/", async (req, res) => {
  res.json(await searchJobs(jobQuerySchema.parse(req.query)));
});

jobsRouter.get("/:id", async (req, res) => {
  const job = await findJob(idParam(req.params.id));
  if (!job) throw notFound("Job");
  res.json(job);
});

jobsRouter.post("/", async (req, res) => {
  const data = jobSchema.parse(req.body);
  if (!(await companyExists(data.company_id))) throw new HttpError(422, "Unknown company_id");
  res.status(201).json(await createJob(data));
});

jobsRouter.patch("/:id", async (req, res) => {
  const job = await updateJob(idParam(req.params.id), jobUpdateSchema.parse(req.body));
  if (!job) throw notFound("Job");
  res.json(job);
});

jobsRouter.post("/:id/close", async (req, res) => {
  const job = await closeJob(idParam(req.params.id));
  if (!job) throw notFound("Job");
  res.json(job);
});
