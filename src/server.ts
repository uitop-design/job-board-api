import { config } from "./config.js";
import { createApp } from "./app.js";

createApp().listen(config.port, () => {
  console.log(`job-board-api listening on :${config.port}`);
});
