export const EligibilityReason = {
  INVALID_TOKEN: "INVALID_TOKEN",
  REGISTRATION_NOT_STARTED: "REGISTRATION_NOT_STARTED",
  REGISTRATION_CLOSED: "REGISTRATION_CLOSED",
  EVENT_PAUSED: "EVENT_PAUSED",
  CAPACITY_REACHED: "CAPACITY_REACHED",
  ALREADY_CONFIRMED: "ALREADY_CONFIRMED",
} as const;

export const EligibilityReasonMessage = {
  INVALID_TOKEN: "This invitation is invalid.",
  REGISTRATION_NOT_STARTED: "Registration is not yet open.",
  REGISTRATION_CLOSED: "Registration for this event is closed.",
  EVENT_PAUSED: "Registration is temporarily unavailable.",
  CAPACITY_REACHED: "No seats are currently available for this event.",
  ALREADY_CONFIRMED: "Your attendance has already been confirmed.",
} as const;
