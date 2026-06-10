import { NotFoundError } from "@vulkan/errors/common.errors";
import { withErrorHandling } from "@vulkan/lib/http/with-error-handling";
import { AttendanceConfirmationRoutes } from "@vulkan/routes/attendance-confirmation.routes";
import { AuthRoutes } from "@vulkan/routes/auth.routes";
import { DiscountPreviewRoutes } from "@vulkan/routes/discount-preview.routes";
import { EmailTemplateRoutes } from "@vulkan/routes/email-template.routes";
import { EventMetricsRoutes } from "@vulkan/routes/event-metrics.routes";
import { EventOfferingsRoutes } from "@vulkan/routes/event-offerings.routes";
import { InvitationDispatchesRoutes } from "@vulkan/routes/invitation-dispatches.routes";
import { InvitationDraftRoutes } from "@vulkan/routes/invitation-draft.routes";
import { InvitationOfferingsRoutes } from "@vulkan/routes/invitation-offerings.routes";
import { InvitationTokensRoutes } from "@vulkan/routes/invitation-tokens.routes";
import { InvitationsRoutes } from "@vulkan/routes/invitations.routes";
import { OfferingImportsRoutes } from "@vulkan/routes/offering-imports.routes";
import { OfferingsRoutes } from "@vulkan/routes/offerings.routes";
import {
  PortfolioListRoutes,
  PortfolioRoutes,
} from "@vulkan/routes/portfolios.routes";
import { ProfileRoutes } from "@vulkan/routes/profile.routes";
import { RosterRoutes } from "@vulkan/routes/roster.routes";
import { SalesEventRoutes } from "@vulkan/routes/sales-events.routes";
import { SeatReservationRoutes } from "@vulkan/routes/seat-reservation.routes";
import { UserRoutes } from "@vulkan/routes/user.routes";
import express from "express";

export const ApiRouter = express.Router();

ApiRouter.use("/auth", AuthRoutes);
ApiRouter.use("/users", UserRoutes);
ApiRouter.use("/profile", ProfileRoutes);
ApiRouter.use("/offerings", OfferingsRoutes);
ApiRouter.use("/offering-imports", OfferingImportsRoutes);

ApiRouter.use("/events", SalesEventRoutes);
ApiRouter.use("/events", EventOfferingsRoutes);
ApiRouter.use("/events", EventMetricsRoutes);
ApiRouter.use("/events", RosterRoutes);
ApiRouter.use("/events", EmailTemplateRoutes);
ApiRouter.use("/events", InvitationsRoutes);
ApiRouter.use("/events", InvitationDispatchesRoutes);
ApiRouter.use("/events", PortfolioListRoutes);

ApiRouter.use("/portfolios", PortfolioRoutes);

ApiRouter.use("/invitations", InvitationTokensRoutes);
ApiRouter.use("/invitations", InvitationOfferingsRoutes);
ApiRouter.use("/invitations", InvitationDraftRoutes);
ApiRouter.use("/invitations", SeatReservationRoutes);
ApiRouter.use("/invitations", AttendanceConfirmationRoutes);
ApiRouter.use("/invitations", DiscountPreviewRoutes);

ApiRouter.all(
  "*splat",
  withErrorHandling(async () => {
    throw new NotFoundError();
  }),
);
