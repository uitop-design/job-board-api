import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("applications", (t) => {
    t.increments("id").primary();
    t.integer("job_id").notNullable().references("jobs.id").onDelete("CASCADE");
    t.string("name", 120).notNullable();
    t.string("email", 200).notNullable();
    t.string("resume_url", 500);
    t.text("cover_letter");
    t.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    t.unique(["job_id", "email"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("applications");
}
