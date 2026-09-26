// Keep the headless browser used by scripts/prerender.mjs inside node_modules,
// which the host caches between builds; the default (~/.cache) is not cached,
// so later builds would lose the browser and skip the prerender step.
const { join } = require("path");

module.exports = {
  cacheDirectory: join(__dirname, "node_modules", ".cache", "puppeteer"),
};
