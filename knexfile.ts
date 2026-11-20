import "dotenv/config";
import type { Knex } from "knex";

const config: Knex.Config = {
  client: "pg",
  connection: process.env.DATABASE_URL ?? "postgres://jobs:jobs@localhost:5432/jobs",
  pool: { min: 0, max: 10 },
  migrations: { directory: "./migrations", tableName: "knex_migrations", loadExtensions: [".ts"] },
  seeds: { directory: "./seeds", loadExtensions: [".ts"] },
};

export default config;
