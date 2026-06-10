export type DispatchResult = {
  dispatchId: string;
  eventId: string;
  queuedCount: number;
  totalInvitations: number;
  progress: DispatchProgress;
};

export type DispatchProgress = {
  dispatchId: string;
  eventId: string;
  total: number;
  pending: number;
  queued: number;
  processing: number;
  sent: number;
  opened: number;
  failed: number;
  confirmed: number;
};
