import { db } from "../db.js";
import { slugify, type CompanyInput } from "../validation.js";
import type { CompanyRow } from "../types/db.js";

export function listCompanies(): Promise<CompanyRow[]> {
  return db("companies").select("*").orderBy("name");
}

export function findCompany(id: number): Promise<CompanyRow | undefined> {
  return db("companies").where({ id }).first();
}

export async function companyExists(id: number): Promise<boolean> {
  return Boolean(await db("companies").where({ id }).first("id"));
}

export async function createCompany(data: CompanyInput): Promise<CompanyRow> {
  const [company] = await db("companies").insert({ ...data, slug: slugify(data.name) }).returning("*");
  if (!company) throw new Error("Insert returned no row");
  return company;
}
