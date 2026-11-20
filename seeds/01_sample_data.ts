import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("applications").del();
  await knex("jobs").del();
  await knex("companies").del();

  const [acme, northwind] = await knex("companies")
    .insert([
      { name: "Acme Logistics", slug: "acme-logistics", website: "https://acme.example", location: "Berlin" },
      { name: "Northwind Labs", slug: "northwind-labs", website: "https://northwind.example", location: "Remote" },
    ])
    .returning("id");

  if (!acme || !northwind) throw new Error("Company seed failed");

  await knex("jobs").insert([
    {
      company_id: acme.id,
      title: "Backend Engineer (Node.js)",
      description: "Build and run the services behind our delivery tracking platform.",
      location: "Berlin",
      remote: false,
      employment_type: "full_time",
      salary_min: 65000,
      salary_max: 85000,
    },
    {
      company_id: acme.id,
      title: "QA Intern",
      description: "Help us test the driver app and the dispatcher dashboard.",
      location: "Berlin",
      employment_type: "internship",
    },
    {
      company_id: northwind.id,
      title: "Frontend Developer (React)",
      description: "Own the UI of our analytics product.",
      location: "Europe",
      remote: true,
      employment_type: "contract",
      salary_min: 50000,
      salary_max: 70000,
    },
  ]);
}
