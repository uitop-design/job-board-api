import type { Knex } from "knex";
import { db } from "../db.js";
import { config } from "../config.js";
import { cached, invalidatePrefix, keyFor } from "../cache.js";
import { pageMeta, toOffset, type Page } from "../pagination.js";
import type { JobInput, JobQuery, JobUpdate } from "../validation.js";
import type { JobRow } from "../types/db.js";

const SEARCH_PREFIX = "jobs:search";

export type JobListItem = JobRow & { company_name: string };
export type JobDetails = JobListItem & { company_website: string | null };

function applyFilters<Q extends Knex.QueryBuilder>(query: Q, f: JobQuery): Q {
  if (f.q) query.whereILike("jobs.title", `%${f.q}%`);
  if (f.location) query.whereILike("jobs.location", `%${f.location}%`);
  if (f.remote !== undefined) query.where("jobs.remote", f.remote);
  if (f.type) query.where("jobs.employment_type", f.type);
  if (f.minSalary) query.whereRaw("coalesce(jobs.salary_max, jobs.salary_min) >= ?", [f.minSalary]);
  if (f.company) query.where("jobs.company_id", f.company);
  return query;
}

export function searchJobs(f: JobQuery): Promise<Page<JobListItem>> {
  return cached(keyFor(SEARCH_PREFIX, f), config.jobsCacheTtl, async () => {
    const base = applyFilters(
      db("jobs").join("companies", "companies.id", "jobs.company_id").where("jobs.status", "open"),
      f,
    );
    const [row] = await base.clone().count<{ count: string }[]>("jobs.id as count");
    const items = await base
      .select<JobListItem[]>("jobs.*", "companies.name as company_name")
      .orderBy("jobs.created_at", "desc")
      .limit(f.limit)
      .offset(toOffset(f.page, f.limit));
    return { items, meta: pageMeta(Number(row?.count ?? 0), f.page, f.limit) };
  });
}

export function findJob(id: number): Promise<JobDetails | undefined> {
  return db("jobs")
    .join("companies", "companies.id", "jobs.company_id")
    .select<JobDetails[]>("jobs.*", "companies.name as company_name", "companies.website as company_website")
    .where("jobs.id", id)
    .first();
}

export function findJobStatus(id: number): Promise<Pick<JobRow, "id" | "status"> | undefined> {
  return db("jobs").where({ id }).first("id", "status");
}

export async function createJob(data: JobInput): Promise<JobRow> {
  const [job] = await db("jobs").insert(data).returning("*");
  if (!job) throw new Error("Insert returned no row");
  await invalidatePrefix(SEARCH_PREFIX);
  return job;
}

export async function updateJob(id: number, data: JobUpdate & { status?: JobRow["status"] }): Promise<JobRow | null> {
  const [job] = await db("jobs")
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning("*");
  if (job) await invalidatePrefix(SEARCH_PREFIX);
  return job ?? null;
}

export function closeJob(id: number): Promise<JobRow | null> {
  return updateJob(id, { status: "closed" });
}
