import { describe, expect, it } from "vitest";
import { pageMeta, toOffset } from "../src/pagination.js";
import { keyFor } from "../src/cache.js";
import { idParam, HttpError } from "../src/errors.js";
import { applicationSchema, jobQuerySchema, jobSchema, jobUpdateSchema, slugify } from "../src/validation.js";

describe("pagination", () => {
  it("computes offsets", () => {
    expect(toOffset(1, 20)).toBe(0);
    expect(toOffset(3, 10)).toBe(20);
  });

  it("builds page meta and never reports zero pages", () => {
    expect(pageMeta(45, 2, 20)).toEqual({ page: 2, limit: 20, total: 45, pages: 3 });
    expect(pageMeta(0, 1, 20).pages).toBe(1);
  });
});

describe("keyFor", () => {
  it("ignores property order and empty values", () => {
    const a = keyFor("jobs:search", { q: "Node", page: 1, limit: 20, remote: undefined });
    const b = keyFor("jobs:search", { limit: 20, page: 1, q: "node", location: "" });
    expect(a).toBe(b);
    expect(a).toBe("jobs:search:limit=20&page=1&q=node");
  });
});

describe("idParam", () => {
  it("accepts positive integers", () => {
    expect(idParam("42")).toBe(42);
  });

  it("rejects anything else with 400", () => {
    for (const bad of ["0", "-1", "abc", "1.5", undefined]) {
      expect(() => idParam(bad)).toThrow(HttpError);
    }
  });
});

describe("validation", () => {
  it("coerces query strings", () => {
    const f = jobQuerySchema.parse({ remote: "true", minSalary: "50000", page: "2" });
    expect(f).toMatchObject({ remote: true, minSalary: 50000, page: 2, limit: 20 });
  });

  it("caps the page size", () => {
    expect(jobQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });

  it("rejects an inverted salary range on create and update", () => {
    const job = {
      company_id: 1,
      title: "Engineer",
      description: "A long enough description of the role.",
      salary_min: 90000,
      salary_max: 60000,
    };
    expect(jobSchema.safeParse(job).success).toBe(false);
    expect(jobUpdateSchema.safeParse({ salary_min: 90000, salary_max: 60000 }).success).toBe(false);
  });

  it("normalizes applicant email", () => {
    const a = applicationSchema.parse({ name: "Ann Lee", email: "  Ann@Example.COM " });
    expect(a.email).toBe("ann@example.com");
  });

  it("slugifies company names", () => {
    expect(slugify("Acme Logistics, Inc.")).toBe("acme-logistics-inc");
  });
});
