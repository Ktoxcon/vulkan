export const invitationFlowQueryKey = ["invitation-flow"] as const

export const DRAFT_DEBOUNCE_MS = 800

export const PREVIEW_DEBOUNCE_MS = 500

export const INTERESTED_OFFERINGS_MAX_VISIBLE = 4

export const INTERESTED_OFFERINGS_MAX_HEIGHT = "max-h-56"

export const FlowStep = {
  PersonalInfo: "personal-info",
  Interests: "interests",
  Review: "review",
} as const

export const stepIndicatorSteps = [
  { key: FlowStep.PersonalInfo, labelKey: "steps.personalInfo" },
  { key: FlowStep.Interests, labelKey: "steps.interests" },
  { key: FlowStep.Review, labelKey: "steps.review" },
] as const
