import { config } from "./config.js";
import { createApp } from "./app.js";
import { db } from "./db.js";
import { redis } from "./cache.js";
import { logger } from "./logger.js";

const server = createApp().listen(config.port, () => {
  logger.info(`job-board-api listening on :${config.port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info(`${signal} received, shutting down`);
  server.close(async () => {
    await Promise.allSettled([db.destroy(), redis.quit()]);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
