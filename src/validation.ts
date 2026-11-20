import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  website: z.string().url().max(255).optional(),
  location: z.string().trim().max(120).optional(),
  about: z.string().trim().max(5000).optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
