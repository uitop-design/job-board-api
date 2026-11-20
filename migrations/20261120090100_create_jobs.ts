import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("jobs", (t) => {
    t.increments("id").primary();
    t.integer("company_id").notNullable().references("companies.id").onDelete("CASCADE");
    t.string("title", 160).notNullable();
    t.text("description").notNullable();
    t.string("location", 120);
    t.boolean("remote").notNullable().defaultTo(false);
    t.enu("employment_type", ["full_time", "part_time", "contract", "internship"])
      .notNullable()
      .defaultTo("full_time");
    t.integer("salary_min");
    t.integer("salary_max");
    t.enu("status", ["open", "closed"]).notNullable().defaultTo("open");
    t.timestamps(true, true);
    t.index(["status", "created_at"]);
    t.index(["company_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("jobs");
}
