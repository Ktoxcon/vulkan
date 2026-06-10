import { ConfirmationFlow } from "@/features/invitation-flow/components/confirmation-flow.component";
import { ConfirmationSuccess } from "@/features/invitation-flow/components/confirmation-success.component";
import { IneligibleNotice } from "@/features/invitation-flow/components/ineligible-notice.component";
import { useTokenResolution } from "@/features/invitation-flow/hooks/token-resolution.hook";
import type { ConfirmationResult } from "@/features/invitation-flow/types/invitation-flow.types";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

export function InvitationPage() {
  const { t } = useTranslation("invitation-flow");
  const { token } = useParams<{ token: string }>();
  const { resolution, isLoading, isError } = useTokenResolution(token);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !resolution) {
    return <IneligibleNotice reason="INVALID_TOKEN" />;
  }

  const { event, client, confirmation, eligible, reason, hasDraft } =
    resolution;

  if (confirmation.confirmed) {
    const confirmedResult: ConfirmationResult = {
      message: t("success.alreadyConfirmed"),
      confirmationId: "",
      confirmedAt: confirmation.confirmedAt ?? "",
      attendanceDate: event.eventStartDate,
      event: {
        id: event.id,
        name: event.name,
        eventStartDate: event.eventStartDate,
        eventEndDate: event.eventEndDate,
      },
      interests: { products: [], services: [] },
    };

    return <ConfirmationSuccess result={confirmedResult} />;
  }

  if (!eligible) {
    return (
      <IneligibleNotice
        reason={reason ?? "INVALID_TOKEN"}
        eventName={event.name}
      />
    );
  }

  return (
    <ConfirmationFlow
      token={token as string}
      event={event}
      client={client}
      hasDraft={hasDraft}
    />
  );
}
