import { db } from "../db.js";
import type { ApplicationInput } from "../validation.js";
import type { ApplicationRow } from "../types/db.js";

export type ApplicationSummary = Pick<ApplicationRow, "id" | "job_id" | "name" | "email" | "created_at">;

export async function hasApplied(jobId: number, email: string): Promise<boolean> {
  return Boolean(await db("applications").where({ job_id: jobId, email }).first("id"));
}

export async function createApplication(jobId: number, data: ApplicationInput): Promise<ApplicationSummary> {
  const [application] = await db("applications")
    .insert({ ...data, job_id: jobId })
    .returning(["id", "job_id", "name", "email", "created_at"]);
  if (!application) throw new Error("Insert returned no row");
  return application;
}

export function listApplications(jobId: number): Promise<ApplicationRow[]> {
  return db("applications").where({ job_id: jobId }).orderBy("created_at", "desc");
}
