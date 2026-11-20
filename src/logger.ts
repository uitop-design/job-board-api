import { pino } from "pino";
import { config } from "./config.js";

export const logger = pino({
  level: config.logLevel,
  enabled: config.env !== "test",
  transport: config.env === "development" ? { target: "pino-pretty" } : undefined,
});
