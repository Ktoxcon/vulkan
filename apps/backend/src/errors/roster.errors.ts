import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class RosterFileMissingError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 400,
      code: "ROSTER_FILE_MISSING",
      message: "A CSV file is required.",
    });
  }
}

export class RosterFileTypeError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 400,
      code: "ROSTER_FILE_TYPE_INVALID",
      message: "Uploaded file must be a CSV.",
    });
  }
}

export class RosterFileEmptyError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 400,
      code: "ROSTER_FILE_EMPTY",
      message: "The CSV file contains no data rows.",
    });
  }
}

export class RosterFileTooLargeError extends VulkanApiError {
  constructor(maxRows: number) {
    super({
      httpStatusCode: 400,
      code: "ROSTER_FILE_TOO_LARGE",
      message: `The CSV file exceeds the maximum of ${maxRows} rows.`,
    });
  }
}

export class RosterCsvMalformedError extends VulkanApiError {
  constructor(message: string) {
    super({
      httpStatusCode: 400,
      code: "ROSTER_CSV_MALFORMED",
      message,
    });
  }
}

export class EventLockedForRosterError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "EVENT_LOCKED_FOR_ROSTER",
      message:
        "Roster changes are only allowed while the event is in Draft status.",
    });
  }
}

export class ImportRecordNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "IMPORT_RECORD_NOT_FOUND",
      message: "Import record not found.",
    });
  }
}

export class ImportRecordAlreadyConfirmedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "IMPORT_RECORD_ALREADY_CONFIRMED",
      message: "This import has already been confirmed.",
    });
  }
}

export class ImportRecordEmptyAcceptedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "IMPORT_RECORD_NO_ACCEPTED_CLIENTS",
      message: "This import has no accepted clients to commit.",
    });
  }
}

export class RosterNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "ROSTER_NOT_FOUND",
      message: "No roster exists for this event.",
    });
  }
}

export class RosterClientDuplicateError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "ROSTER_CLIENT_DUPLICATE",
      message: "A client with this email is already on the roster.",
    });
  }
}
