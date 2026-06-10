import { AppConfig } from "@vulkan/config/app.config";
import { clients } from "@vulkan/lib/db/schema/clients";
import { emailTemplates } from "@vulkan/lib/db/schema/email-templates";
import { eventOfferingChanges } from "@vulkan/lib/db/schema/event-offering-changes";
import { eventOfferings } from "@vulkan/lib/db/schema/event-offerings";
import { importRecords } from "@vulkan/lib/db/schema/import-records";
import { invitationStatusEvents } from "@vulkan/lib/db/schema/invitation-status-events";
import { invitations } from "@vulkan/lib/db/schema/invitations";
import { offerings } from "@vulkan/lib/db/schema/offerings";
import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";
import { rosters } from "@vulkan/lib/db/schema/rosters";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import { users } from "@vulkan/lib/db/schema/users";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const schema = {
  users,
  salesEvents,
  offerings,
  eventOfferings,
  eventOfferingChanges,
  clients,
  rosters,
  rosterClients,
  invitations,
  invitationStatusEvents,
  emailTemplates,
  importRecords,
};

export type Database = NodePgDatabase<typeof schema>;

let poolSingleton: Pool | null = null;
let dbSingleton: Database | null = null;

export function getPool(): Pool {
  if (!poolSingleton) {
    poolSingleton = new Pool({
      host: AppConfig.db.host,
      port: AppConfig.db.port,
      user: AppConfig.db.user,
      password: AppConfig.db.password,
      database: AppConfig.db.name,
    });
  }
  return poolSingleton;
}

export function getDb(): Database {
  if (!dbSingleton) {
    dbSingleton = drizzle(getPool(), { schema });
  }
  return dbSingleton;
}

export function __setDbForTesting(instance: Database | null): void {
  dbSingleton = instance;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop: string | symbol) {
    const instance = getDb() as unknown as Record<string | symbol, unknown>;
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
