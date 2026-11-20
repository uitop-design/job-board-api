import { z } from "zod";
import { EMPLOYMENT_TYPES } from "./types/db.js";

export const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().url().max(255).optional(),
  location: z.string().trim().max(120).optional(),
  about: z.string().trim().max(5000).optional(),
});

const boolString = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");

export const jobQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  location: z.string().trim().max(120).optional(),
  remote: boolString.optional(),
  type: z.enum(EMPLOYMENT_TYPES).optional(),
  minSalary: z.coerce.number().int().min(0).optional(),
  company: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CompanyInput = z.infer<typeof companySchema>;
export type JobQuery = z.infer<typeof jobQuerySchema>;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
