export type EmailTemplatePreview = {
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: {
    clientName: string;
    companyName: string;
    eventName: string;
    eventDate: string;
    invitationUrl: string;
  };
};
