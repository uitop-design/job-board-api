import { Router } from "express";
import { db } from "../db.js";
import { idParam, notFound } from "../errors.js";
import { companySchema, slugify } from "../validation.js";

export const companiesRouter = Router();

companiesRouter.get("/", async (_req, res) => {
  res.json(await db("companies").select("*").orderBy("name"));
});

companiesRouter.get("/:id", async (req, res) => {
  const company = await db("companies").where({ id: idParam(req.params.id) }).first();
  if (!company) throw notFound("Company");
  res.json(company);
});

companiesRouter.post("/", async (req, res) => {
  const data = companySchema.parse(req.body);
  const [company] = await db("companies").insert({ ...data, slug: slugify(data.name) }).returning("*");
  res.status(201).json(company);
});
