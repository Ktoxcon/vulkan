export type NewAttendanceConfirmationInput = {
  eventId: string;
  invitationId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  attendanceDate: Date;
  confirmedAt: Date;
};

export type OwnerNotificationContext = {
  ownerEmail: string;
  ownerName: string;
  eventName: string;
  clientName: string;
  clientEmail: string;
  attendanceDate: Date;
};
