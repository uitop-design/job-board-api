import { Router } from "express";
import { db } from "../db.js";
import { jobQuerySchema } from "../validation.js";
import { pageMeta, toOffset } from "../pagination.js";

export const jobsRouter = Router();

jobsRouter.get("/", async (req, res) => {
  const parsed = jobQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const f = parsed.data;

  const query = db("jobs")
    .join("companies", "companies.id", "jobs.company_id")
    .where("jobs.status", "open");

  if (f.q) query.whereILike("jobs.title", `%${f.q}%`);
  if (f.location) query.whereILike("jobs.location", `%${f.location}%`);
  if (f.remote !== undefined) query.where("jobs.remote", f.remote);
  if (f.type) query.where("jobs.employment_type", f.type);
  if (f.minSalary) query.where("jobs.salary_max", ">=", f.minSalary);
  if (f.company) query.where("jobs.company_id", f.company);

  const [row] = await query.clone().count<{ count: string }[]>("jobs.id as count");
  const items = await query
    .select("jobs.*", "companies.name as company_name")
    .orderBy("jobs.created_at", "desc")
    .limit(f.limit)
    .offset(toOffset(f.page, f.limit));

  res.json({ items, meta: pageMeta(Number(row?.count ?? 0), f.page, f.limit) });
});

jobsRouter.get("/:id", async (req, res) => {
  const job = await db("jobs")
    .join("companies", "companies.id", "jobs.company_id")
    .select("jobs.*", "companies.name as company_name", "companies.website as company_website")
    .where("jobs.id", Number(req.params.id))
    .first();
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});
