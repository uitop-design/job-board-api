import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { RequestHandler } from "express";

vi.mock("../src/repositories/jobs.js", () => ({
  searchJobs: vi.fn(),
  findJob: vi.fn(),
  findJobStatus: vi.fn(),
  createJob: vi.fn(),
  updateJob: vi.fn(),
  closeJob: vi.fn(),
}));
vi.mock("../src/repositories/companies.js", () => ({
  listCompanies: vi.fn(),
  findCompany: vi.fn(),
  companyExists: vi.fn(),
  createCompany: vi.fn(),
}));
vi.mock("../src/repositories/applications.js", () => ({
  hasApplied: vi.fn(),
  createApplication: vi.fn(),
  listApplications: vi.fn(),
}));
vi.mock("../src/middleware/rateLimit.js", () => ({
  rateLimit: (): RequestHandler => (_req, _res, next) => next(),
}));

const jobs = await import("../src/repositories/jobs.js");
const companies = await import("../src/repositories/companies.js");
const applications = await import("../src/repositories/applications.js");
const { createApp } = await import("../src/app.js");

const app = createApp();

const validJob = {
  company_id: 1,
  title: "Backend Engineer",
  description: "Work on APIs that power our logistics platform.",
};

describe("jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes parsed filters to the search", async () => {
    vi.mocked(jobs.searchJobs).mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } });
    const res = await request(app).get("/jobs?q=node&remote=true");
    expect(res.status).toBe(200);
    expect(jobs.searchJobs).toHaveBeenCalledWith(expect.objectContaining({ q: "node", remote: true, page: 1 }));
  });

  it("returns 400 on bad filters", async () => {
    const res = await request(app).get("/jobs?type=freelance");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await request(app).get("/jobs/abc");
    expect(res.status).toBe(400);
    expect(jobs.findJob).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing job", async () => {
    vi.mocked(jobs.findJob).mockResolvedValue(undefined);
    const res = await request(app).get("/jobs/42");
    expect(res.status).toBe(404);
  });

  it("refuses jobs for unknown companies", async () => {
    vi.mocked(companies.companyExists).mockResolvedValue(false);
    const res = await request(app).post("/jobs").send(validJob);
    expect(res.status).toBe(422);
    expect(jobs.createJob).not.toHaveBeenCalled();
  });

  it("creates a job", async () => {
    vi.mocked(companies.companyExists).mockResolvedValue(true);
    vi.mocked(jobs.createJob).mockResolvedValue({ id: 7, ...validJob } as never);
    const res = await request(app).post("/jobs").send(validJob);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(7);
  });

  it("surfaces repository failures as 500", async () => {
    vi.mocked(jobs.findJob).mockRejectedValue(new Error("db down"));
    const res = await request(app).get("/jobs/1");
    expect(res.status).toBe(500);
  });
});

describe("applications", () => {
  beforeEach(() => vi.clearAllMocks());

  const body = { name: "Ann Lee", email: "ann@example.com" };

  it("rejects applications to closed jobs", async () => {
    vi.mocked(jobs.findJobStatus).mockResolvedValue({ id: 1, status: "closed" });
    const res = await request(app).post("/jobs/1/applications").send(body);
    expect(res.status).toBe(409);
  });

  it("rejects duplicates", async () => {
    vi.mocked(jobs.findJobStatus).mockResolvedValue({ id: 1, status: "open" });
    vi.mocked(applications.hasApplied).mockResolvedValue(true);
    const res = await request(app).post("/jobs/1/applications").send(body);
    expect(res.status).toBe(409);
    expect(applications.createApplication).not.toHaveBeenCalled();
  });

  it("stores a new application", async () => {
    vi.mocked(jobs.findJobStatus).mockResolvedValue({ id: 1, status: "open" });
    vi.mocked(applications.hasApplied).mockResolvedValue(false);
    vi.mocked(applications.createApplication).mockResolvedValue({ id: 3, job_id: 1, ...body } as never);
    const res = await request(app).post("/jobs/1/applications").send(body);
    expect(res.status).toBe(201);
    expect(applications.createApplication).toHaveBeenCalledWith(1, body);
  });
});

describe("misc", () => {
  it("answers health checks", async () => {
    const res = await request(app).get("/health");
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns json 404 for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });

  it("reports malformed json", async () => {
    const res = await request(app).post("/companies").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
  });
});
