import { DraftConfirmationsRepository } from "@vulkan/lib/repositories/draft-confirmations.repo";
import { DraftConfirmationService } from "@vulkan/lib/services/draft-confirmation.service";
import { makeDraft } from "@tests/fixtures/draft-confirmations";
import { seedInvitationFlow } from "@tests/helpers/seed-invitation-flow";
import { createTestDb, type TestDb } from "@tests/helpers/test-db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let testDb: TestDb;

beforeEach(async () => {
  testDb = await createTestDb();
});

afterEach(async () => {
  await testDb.close();
});

describe("DraftConfirmationService (stories 4.5 / 4.9)", () => {
  it("getByToken returns empty data + null updatedAt when no draft exists", async () => {
    const { invitation } = await seedInvitationFlow();
    const view = await DraftConfirmationService.getByToken(invitation.token);
    expect(view.data).toEqual({});
    expect(view.updatedAt).toBeNull();
  });

  it("saveByToken upserts partial progress and restores it (without confirming)", async () => {
    const { invitation } = await seedInvitationFlow();

    await DraftConfirmationService.saveByToken(invitation.token, {
      firstName: "Ada",
      lastName: "Lovelace",
    });
    const restored = await DraftConfirmationService.getByToken(
      invitation.token,
    );

    expect(restored.data.firstName).toBe("Ada");
    expect(restored.data.lastName).toBe("Lovelace");
    expect(restored.updatedAt).not.toBeNull();
  });

  it("saveByToken is an upsert: a second save overwrites for the same invitation", async () => {
    const { invitation } = await seedInvitationFlow();

    await DraftConfirmationService.saveByToken(invitation.token, {
      firstName: "One",
    });
    await DraftConfirmationService.saveByToken(invitation.token, {
      firstName: "Two",
    });

    const restored = await DraftConfirmationService.getByToken(
      invitation.token,
    );
    expect(restored.data.firstName).toBe("Two");
    const all = await DraftConfirmationsRepository.findByInvitationId(
      invitation.id,
    );
    expect(all).toBeDefined();
  });

  it("throws INVITATION_TOKEN_NOT_FOUND for an unknown token", async () => {
    await expect(
      DraftConfirmationService.getByToken("nope"),
    ).rejects.toMatchObject({ code: "INVITATION_TOKEN_NOT_FOUND" });
  });

  it("throws DRAFT_CONFIRMATION_ALREADY_CONFIRMED for a confirmed invitation", async () => {
    const { invitation } = await seedInvitationFlow(
      {},
      { confirmedAt: new Date("2026-01-01T00:00:00.000Z") },
    );
    await makeDraft(invitation.id, { firstName: "stale" });

    await expect(
      DraftConfirmationService.getByToken(invitation.token),
    ).rejects.toMatchObject({
      code: "DRAFT_CONFIRMATION_ALREADY_CONFIRMED",
      httpStatusCode: 409,
    });
  });
});
