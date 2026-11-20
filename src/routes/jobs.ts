import { Router } from "express";
import { db } from "../db.js";
import { HttpError, idParam, notFound } from "../errors.js";
import { jobQuerySchema, jobSchema, jobUpdateSchema } from "../validation.js";
import { pageMeta, toOffset, type Page } from "../pagination.js";
import { cached, invalidatePrefix, keyFor } from "../cache.js";
import { config } from "../config.js";
import type { JobRow } from "../types/db.js";

type JobListItem = JobRow & { company_name: string };

export const jobsRouter = Router();

jobsRouter.get("/", async (req, res) => {
  const f = jobQuerySchema.parse(req.query);

  const result = await cached<Page<JobListItem>>(keyFor("jobs:search", f), config.jobsCacheTtl, async () => {
    const query = db("jobs")
      .join("companies", "companies.id", "jobs.company_id")
      .where("jobs.status", "open");

    if (f.q) query.whereILike("jobs.title", `%${f.q}%`);
    if (f.location) query.whereILike("jobs.location", `%${f.location}%`);
    if (f.remote !== undefined) query.where("jobs.remote", f.remote);
    if (f.type) query.where("jobs.employment_type", f.type);
    if (f.minSalary) query.whereRaw("coalesce(jobs.salary_max, jobs.salary_min) >= ?", [f.minSalary]);
    if (f.company) query.where("jobs.company_id", f.company);

    const [row] = await query.clone().count<{ count: string }[]>("jobs.id as count");
    const items = await query
      .select<JobListItem[]>("jobs.*", "companies.name as company_name")
      .orderBy("jobs.created_at", "desc")
      .limit(f.limit)
      .offset(toOffset(f.page, f.limit));

    return { items, meta: pageMeta(Number(row?.count ?? 0), f.page, f.limit) };
  });
  res.json(result);
});

jobsRouter.get("/:id", async (req, res) => {
  const job = await db("jobs")
    .join("companies", "companies.id", "jobs.company_id")
    .select("jobs.*", "companies.name as company_name", "companies.website as company_website")
    .where("jobs.id", idParam(req.params.id))
    .first();
  if (!job) throw notFound("Job");
  res.json(job);
});

jobsRouter.post("/", async (req, res) => {
  const data = jobSchema.parse(req.body);
  const company = await db("companies").where({ id: data.company_id }).first("id");
  if (!company) throw new HttpError(422, "Unknown company_id");
  const [job] = await db("jobs").insert(data).returning("*");
  await invalidatePrefix("jobs:search");
  res.status(201).json(job);
});

jobsRouter.patch("/:id", async (req, res) => {
  const data = jobUpdateSchema.parse(req.body);
  const [job] = await db("jobs")
    .where({ id: idParam(req.params.id) })
    .update({ ...data, updated_at: new Date() })
    .returning("*");
  if (!job) throw notFound("Job");
  await invalidatePrefix("jobs:search");
  res.json(job);
});

jobsRouter.post("/:id/close", async (req, res) => {
  const [job] = await db("jobs")
    .where({ id: idParam(req.params.id) })
    .update({ status: "closed", updated_at: new Date() })
    .returning("*");
  if (!job) throw notFound("Job");
  await invalidatePrefix("jobs:search");
  res.json(job);
});
