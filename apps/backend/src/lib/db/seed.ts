import "dotenv/config";
import { createRootUser } from "@vulkan/lib/db/create-root";
import { getPool } from "@vulkan/lib/db/index";

async function main() {
  const id = await createRootUser();
  console.info(`Root admin ready: ${id}`);
  await getPool().end();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
