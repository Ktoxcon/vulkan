export type SeatReservationView = {
  id: string;
  eventId: string;
  invitationId: string;
  status: string;
  expiresAt: Date;
};

export type SeatReservationResult = {
  reservation: SeatReservationView;
  created: boolean;
};
