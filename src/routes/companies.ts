import { Router } from "express";
import { db } from "../db.js";
import { companySchema, slugify } from "../validation.js";

export const companiesRouter = Router();

companiesRouter.get("/", async (_req, res) => {
  res.json(await db("companies").select("*").orderBy("name"));
});

companiesRouter.get("/:id", async (req, res) => {
  const company = await db("companies").where({ id: Number(req.params.id) }).first();
  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  res.json(company);
});

companiesRouter.post("/", async (req, res) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const [company] = await db("companies")
    .insert({ ...parsed.data, slug: slugify(parsed.data.name) })
    .returning("*");
  res.status(201).json(company);
});
