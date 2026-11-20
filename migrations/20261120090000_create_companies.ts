import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("companies", (t) => {
    t.increments("id").primary();
    t.string("name", 120).notNullable();
    t.string("slug", 140).notNullable().unique();
    t.string("website", 255);
    t.string("location", 120);
    t.text("about");
    t.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("companies");
}
