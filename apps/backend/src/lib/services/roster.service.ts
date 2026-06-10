import {
  EventLockedForRosterError,
  ImportRecordAlreadyConfirmedError,
  ImportRecordEmptyAcceptedError,
  ImportRecordNotFoundError,
  RosterClientDuplicateError,
  RosterNotFoundError,
} from "@vulkan/errors/roster.errors";
import { EventStatus } from "@vulkan/lib/constants/event-status";
import type { ImportRecord } from "@vulkan/lib/db/schema/import-records.types";
import type { Roster } from "@vulkan/lib/db/schema/rosters.types";
import type { SalesEvent } from "@vulkan/lib/db/schema/sales-events.types";
import { ImportRecordsRepository } from "@vulkan/lib/repositories/import-records.repo";
import { RostersRepository } from "@vulkan/lib/repositories/rosters.repo";
import type { RosterMember } from "@vulkan/lib/repositories/rosters.repo.types";
import { CsvImportService } from "@vulkan/lib/services/csv-import.service";
import { ImportRecordStatus } from "@vulkan/lib/services/roster.service.constants";
import type {
  ImportUpload,
  RosterView,
} from "@vulkan/lib/services/roster.service.types";
import type { AddRosterClientBody } from "@vulkan/lib/validators/roster.schemas.types";

export const RosterService = {
  assertDraft(event: SalesEvent): void {
    if (event.status !== EventStatus.DRAFT) {
      throw new EventLockedForRosterError();
    }
  },

  async createImport(
    event: SalesEvent,
    actorId: string,
    upload: ImportUpload,
  ): Promise<ImportRecord> {
    RosterService.assertDraft(event);

    const classification = await CsvImportService.classify(upload.buffer);

    return ImportRecordsRepository.create({
      eventId: event.id,
      status: ImportRecordStatus.PENDING,
      fileName: upload.fileName,
      importedCount: classification.importedCount,
      invalidCount: classification.invalidCount,
      duplicateCount: classification.duplicateCount,
      acceptedCount: classification.acceptedCount,
      validRows: classification.validRows,
      invalidRows: classification.invalidRows,
      duplicateRows: classification.duplicateRows,
      createdBy: actorId,
    });
  },

  async getImport(eventId: string, importId: string): Promise<ImportRecord> {
    const record = await ImportRecordsRepository.findByIdForEvent(
      importId,
      eventId,
    );
    if (!record) {
      throw new ImportRecordNotFoundError();
    }
    return record;
  },

  async confirmImport(
    event: SalesEvent,
    actorId: string,
    importId: string,
  ): Promise<Roster> {
    RosterService.assertDraft(event);

    const record = await RosterService.getImport(event.id, importId);
    if (record.status === ImportRecordStatus.CONFIRMED) {
      throw new ImportRecordAlreadyConfirmedError();
    }
    if (record.validRows.length === 0) {
      throw new ImportRecordEmptyAcceptedError();
    }

    return RostersRepository.commitImport(
      event.id,
      record.id,
      actorId,
      record.validRows,
    );
  },

  async getRoster(eventId: string): Promise<RosterView> {
    const roster = await RostersRepository.findByEventId(eventId);
    if (!roster) {
      throw new RosterNotFoundError();
    }
    const clients = await RostersRepository.listRosterClients(roster.id);
    return { roster, clients };
  },

  async addClient(
    event: SalesEvent,
    actorId: string,
    input: AddRosterClientBody,
  ): Promise<RosterMember> {
    RosterService.assertDraft(event);

    const member = await RostersRepository.addClient(event.id, actorId, input);
    if (!member) {
      throw new RosterClientDuplicateError();
    }
    return member;
  },
};
