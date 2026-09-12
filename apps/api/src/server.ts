import { createApp } from "./app.js";
import { config } from "./config.js";
import { tossKeyWarnings } from "./lib/toss.js";

const app = createApp();
app.listen(config.API_PORT, () => {
  console.log(`[api] listening on http://localhost:${config.API_PORT} (${config.NODE_ENV})`);
  for (const warning of tossKeyWarnings()) console.warn(`[api] 경고: ${warning}`);
});
