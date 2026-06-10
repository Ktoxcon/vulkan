import { db } from "@vulkan/lib/db/index";
import { clients } from "@vulkan/lib/db/schema/clients";
import type { Client } from "@vulkan/lib/db/schema/clients.types";

export async function makeClient(
  overrides: Partial<{
    email: string;
  }> = {},
): Promise<Client> {
  const [row] = await db
    .insert(clients)
    .values({
      email:
        overrides.email ??
        `client-${Math.random().toString(36).slice(2)}@email.com`,
    })
    .returning();
  return row as Client;
}
