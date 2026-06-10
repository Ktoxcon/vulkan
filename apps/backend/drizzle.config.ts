import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbCredentials = process.env.DATABASE_URL
  ? { url: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? "postgres",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "vulkan",
      ssl: false,
    };

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/*.ts",
  out: "./drizzle",
  dbCredentials,
  verbose: true,
  strict: true,
});
