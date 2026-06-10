import type { ImportRecord } from "@vulkan/lib/db/schema/import-records.types";
import type { Roster } from "@vulkan/lib/db/schema/rosters.types";
import type { RosterMember } from "@vulkan/lib/repositories/rosters.repo.types";

export type ImportUpload = {
  fileName: string;
  buffer: Buffer;
};

export type RosterView = {
  roster: Roster;
  clients: RosterMember[];
};

export type ImportPreview = ImportRecord;
