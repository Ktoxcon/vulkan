import { PGlite } from "@electric-sql/pglite";
import { __setDbForTesting, schema, type Database } from "@vulkan/lib/db";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

export type TestDb = {
  db: Database;
  client: PGlite;
  close: () => Promise<void>;
};

export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as Database;

  await migrate(db as never, { migrationsFolder: "./drizzle" });

  __setDbForTesting(db);

  return {
    db,
    client,
    close: async () => {
      __setDbForTesting(null);
      await client.close();
    },
  };
}
