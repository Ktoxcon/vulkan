export type ConfirmationInterestView = {
  offeringId: string;
  name: string;
};

export type ConfirmationEventView = {
  id: string;
  name: string;
  eventStartDate: Date;
  eventEndDate: Date | null;
};

export type AttendanceConfirmationView = {
  message: string;
  confirmationId: string;
  confirmedAt: Date;
  attendanceDate: Date;
  event: ConfirmationEventView;
  interests: {
    products: ConfirmationInterestView[];
    services: ConfirmationInterestView[];
  };
};
