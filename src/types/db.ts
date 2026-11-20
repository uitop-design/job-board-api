export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type JobStatus = "open" | "closed";

export interface CompanyRow {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  location: string | null;
  about: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JobRow {
  id: number;
  company_id: number;
  title: string;
  description: string;
  location: string | null;
  remote: boolean;
  employment_type: EmploymentType;
  salary_min: number | null;
  salary_max: number | null;
  status: JobStatus;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicationRow {
  id: number;
  job_id: number;
  name: string;
  email: string;
  resume_url: string | null;
  cover_letter: string | null;
  created_at: Date;
}

type Generated = "id" | "created_at" | "updated_at";

declare module "knex/types/tables" {
  interface Tables {
    companies: import("knex").Knex.CompositeTableType<
      CompanyRow,
      Omit<CompanyRow, Generated> | Partial<Omit<CompanyRow, Generated>>,
      Partial<Omit<CompanyRow, "id">>
    >;
    jobs: import("knex").Knex.CompositeTableType<
      JobRow,
      Partial<Omit<JobRow, Generated>> & Pick<JobRow, "company_id" | "title" | "description">,
      Partial<Omit<JobRow, "id" | "created_at">>
    >;
    applications: import("knex").Knex.CompositeTableType<
      ApplicationRow,
      Partial<Omit<ApplicationRow, "id" | "created_at">> & Pick<ApplicationRow, "job_id" | "name" | "email">
    >;
  }
}
