import { Router } from "express";
import { idParam, notFound } from "../errors.js";
import { companySchema } from "../validation.js";
import { createCompany, findCompany, listCompanies } from "../repositories/companies.js";

export const companiesRouter = Router();

companiesRouter.get("/", async (_req, res) => {
  res.json(await listCompanies());
});

companiesRouter.get("/:id", async (req, res) => {
  const company = await findCompany(idParam(req.params.id));
  if (!company) throw notFound("Company");
  res.json(company);
});

companiesRouter.post("/", async (req, res) => {
  res.status(201).json(await createCompany(companySchema.parse(req.body)));
});
