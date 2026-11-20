# Job Board API

REST API for a small job board: companies post vacancies, candidates search them and apply.
Written in TypeScript on Express 5 with Knex and PostgreSQL. Redis caches search pages and
rate limits applications.

## Stack

- Node.js 20, TypeScript 5 (strict, ES modules)
- Express 5: async handlers, errors from rejected promises go straight to the error middleware
- PostgreSQL 16, Knex migrations and seeds, typed tables via `knex/types/tables`
- Redis 7 via ioredis
- Zod for env and request validation, pino for logs
- Vitest + Supertest

## Quick start

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The API listens on `http://localhost:4000`.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Run with reload via `tsx watch`      |
| `npm run build`     | Compile to `dist/`                   |
| `npm start`         | Run the compiled build               |
| `npm run typecheck` | Type check the whole project         |
| `npm test`          | Run the test suite                   |

## Configuration

The environment is validated on startup (`src/config.ts`), so a typo fails fast.

| Variable            | Default                                    | Purpose                              |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| `PORT`              | `4000`                                     | HTTP port                            |
| `DATABASE_URL`      | `postgres://jobs:jobs@localhost:5432/jobs` | Postgres connection                  |
| `REDIS_URL`         | `redis://localhost:6379`                   | Redis connection                     |
| `JOBS_CACHE_TTL`    | `60`                                       | Seconds a search page stays cached   |
| `APPLY_RATE_MAX`    | `5`                                        | Applications allowed per IP / window |
| `APPLY_RATE_WINDOW` | `3600`                                     | Rate limit window in seconds         |
| `LOG_LEVEL`         | `debug`, `info` in production              | pino log level                       |

## Endpoints

### Companies

| Method | Path             | Notes                                  |
| ------ | ---------------- | -------------------------------------- |
| GET    | `/companies`     | All companies                          |
| GET    | `/companies/:id` | One company                            |
| POST   | `/companies`     | `name`, `website`, `location`, `about` |

### Jobs

| Method | Path              | Notes                                  |
| ------ | ----------------- | -------------------------------------- |
| GET    | `/jobs`           | Open jobs, query parameters below      |
| GET    | `/jobs/:id`       | Job with company name and website      |
| POST   | `/jobs`           | Create a job                           |
| PATCH  | `/jobs/:id`       | Partial update                         |
| POST   | `/jobs/:id/close` | Close a job, it leaves the search      |

`GET /jobs` filters: `q` (title), `location`, `remote` (`true`/`false`),
`type` (`full_time`, `part_time`, `contract`, `internship`), `minSalary`, `company`,
`page`, `limit` (up to 50).

```json
{
  "items": [{ "id": 1, "title": "Backend Engineer (Node.js)", "company_name": "Acme Logistics" }],
  "meta": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
}
```

### Applications

| Method | Path                        | Notes                                          |
| ------ | --------------------------- | ---------------------------------------------- |
| POST   | `/jobs/:jobId/applications` | `name`, `email`, `resume_url`, `cover_letter`  |
| GET    | `/jobs/:jobId/applications` | Applications for a job                         |

One application per email per job; closed jobs answer `409`.

## Caching and rate limiting

- Search pages are cached under `jobs:search:<sorted filters>`. Creating, updating or closing a
  job clears `jobs:search:*` using `SCAN`.
- Applications use a fixed window counter `ratelimit:apply:<ip>` with `X-RateLimit-*` headers
  and `429 Retry-After` when the limit is reached.
- Both fail open: without Redis the API keeps working on Postgres alone.

## Errors

Every error is JSON: `{ "error": "message", "details": { ... } }`.
`400` validation, `404` not found, `409` conflict, `422` unknown company.

## Layout

```
migrations/          Knex migrations (TypeScript)
seeds/               sample data
src/app.ts           Express app factory
src/server.ts        HTTP server and shutdown
src/config.ts        validated environment
src/routes/          route handlers
src/repositories/    SQL queries
src/middleware/      errors, rate limit
src/types/db.ts      table row types
tests/               Vitest suites
```
