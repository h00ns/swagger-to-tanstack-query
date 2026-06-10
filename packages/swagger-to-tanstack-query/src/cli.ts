#!/usr/bin/env node
import { loadConfig } from "./load-config.js";
import { generate } from "./index.js";

async function main() {
  const cwd = process.cwd();
  console.log("swagger-to-tanstack-query");

  const config = await loadConfig(cwd);
  console.log(`  spec   : ${config.url}`);
  console.log(`  output : ${config.output}`);
  console.log(`  client : ${config.client.name} from "${config.client.path}"`);
  console.log("  generating...");

  const result = await generate(config);
  console.log(`  done. ${result.controllers} controllers, ${result.files} files.`);
}

main().catch((err) => {
  console.error("\n" + (err?.message ?? err));
  process.exit(1);
});
