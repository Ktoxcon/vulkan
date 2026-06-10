import "dotenv/config";
import { getDb, getPool } from "@vulkan/lib/db/index";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
  const db = getDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.info("Migrations applied.");
  await getPool().end();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
