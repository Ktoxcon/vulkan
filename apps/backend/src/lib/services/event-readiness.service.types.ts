export type ReadinessChecks = {
  detailsConfigured: boolean;
  capacityConfigured: boolean;
  offeringsAssigned: boolean;
  rosterUploaded: boolean;
  rosterHasValidClient: boolean;
  inviteTokensReady: boolean;
  emailTemplateConfigured: boolean;
  registrationDatesValid: boolean;
};

export type ReadinessReport = {
  ready: boolean;
  checks: ReadinessChecks;
};
