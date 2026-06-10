import { VulkanApiError } from "@vulkan/errors/vulkan-api-error";

export class OfferingImportFileMissingError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 400,
      code: "OFFERING_IMPORT_FILE_MISSING",
      message: "A CSV file is required.",
    });
  }
}

export class OfferingImportFileTypeError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 400,
      code: "OFFERING_IMPORT_FILE_TYPE_INVALID",
      message: "Uploaded file must be a CSV.",
    });
  }
}

export class OfferingImportFileEmptyError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 400,
      code: "OFFERING_IMPORT_FILE_EMPTY",
      message: "The CSV file contains no data rows.",
    });
  }
}

export class OfferingImportCsvMalformedError extends VulkanApiError {
  constructor(message: string) {
    super({
      httpStatusCode: 400,
      code: "OFFERING_IMPORT_CSV_MALFORMED",
      message,
    });
  }
}

export class OfferingImportNotFoundError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 404,
      code: "OFFERING_IMPORT_NOT_FOUND",
      message: "Offering import not found.",
    });
  }
}

export class OfferingImportAlreadyConfirmedError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "OFFERING_IMPORT_ALREADY_CONFIRMED",
      message: "This offering import has already been confirmed.",
    });
  }
}

export class OfferingImportEmptyValidError extends VulkanApiError {
  constructor() {
    super({
      httpStatusCode: 409,
      code: "OFFERING_IMPORT_NO_VALID_ROWS",
      message: "This offering import has no valid rows to import.",
    });
  }
}
