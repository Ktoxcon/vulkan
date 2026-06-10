export const InvitationTokenByteLength = 32;

export const MillisecondsPerDay = 86400000;

export const InvitationReportColumns = [
  "email",
  "status",
  "sentAt",
  "openedAt",
  "confirmedAt",
] as const;

export const TrackingPixelContentType = "image/gif";

export const TrackingPixelGif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);
