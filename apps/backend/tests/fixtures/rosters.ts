import { db } from "@vulkan/lib/db/index";
import { rosterClients } from "@vulkan/lib/db/schema/roster-clients";
import { rosters } from "@vulkan/lib/db/schema/rosters";
import type { Roster } from "@vulkan/lib/db/schema/rosters.types";
import { makeClient } from "@tests/fixtures/clients";

export type RosterMemberFixture = {
  rosterClientId: string;
  id: string;
  email: string;
  name: string;
  company: string | null;
};

export async function makeRosterWithClients(
  eventId: string,
  uploadedBy: string,
  count: number,
): Promise<{ roster: Roster; clients: RosterMemberFixture[] }> {
  const [roster] = await db
    .insert(rosters)
    .values({ eventId, uploadedBy, totalClients: count })
    .returning();
  const committed = roster as Roster;

  const members: RosterMemberFixture[] = [];
  for (let index = 0; index < count; index += 1) {
    const client = await makeClient();
    const name = `Client ${index + 1}`;
    const company = "Acme";
    const [membership] = await db
      .insert(rosterClients)
      .values({ rosterId: committed.id, clientId: client.id, name, company })
      .returning();
    members.push({
      rosterClientId: membership!.id,
      id: client.id,
      email: client.email,
      name,
      company,
    });
  }

  return { roster: committed, clients: members };
}

export async function addRosterClient(
  rosterId: string,
): Promise<RosterMemberFixture> {
  const client = await makeClient();
  const name = `Client ${Math.random().toString(36).slice(2)}`;
  const company = "Acme";
  const [membership] = await db
    .insert(rosterClients)
    .values({ rosterId, clientId: client.id, name, company })
    .returning();
  return {
    rosterClientId: membership!.id,
    id: client.id,
    email: client.email,
    name,
    company,
  };
}
