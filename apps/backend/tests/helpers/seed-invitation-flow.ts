import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { Invitation } from "@vulkan/lib/db/schema/invitations.types";
import type { Roster } from "@vulkan/lib/db/schema/rosters.types";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import type { User } from "@vulkan/lib/db/schema/users";
import { makeInvitation } from "@tests/fixtures/invitations";
import type { RosterMemberFixture } from "@tests/fixtures/rosters";
import { makeRosterWithClients } from "@tests/fixtures/rosters";
import { makeSalesEvent } from "@tests/fixtures/sales-events";
import { makeUser } from "@tests/fixtures/users";

const OpenWindow = {
  registrationStartDate: new Date("2000-01-01T00:00:00.000Z"),
  registrationEndDate: new Date("2999-01-01T00:00:00.000Z"),
};

export type InvitationFlowSeed = {
  owner: User;
  event: SalesEvent;
  roster: Roster;
  invitation: Invitation;
  client: RosterMemberFixture;
};

export async function seedInvitationFlow(
  eventOverrides: Parameters<typeof makeSalesEvent>[1] = {},
  invitationOverrides: Parameters<typeof makeInvitation>[2] = {},
): Promise<InvitationFlowSeed> {
  const owner = await makeUser({ role: "sales" });
  const event = await makeSalesEvent(owner.id, {
    status: EventStatus.ACTIVE,
    capacity: 30,
    ...OpenWindow,
    ...eventOverrides,
  });
  const { roster, clients } = await makeRosterWithClients(event.id, owner.id, 1);
  const invitation = await makeInvitation(
    event.id,
    clients[0]!.id,
    invitationOverrides,
  );
  return { owner, event, roster, invitation, client: clients[0]! };
}
