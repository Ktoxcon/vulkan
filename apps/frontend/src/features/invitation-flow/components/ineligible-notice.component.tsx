import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EligibilityReason } from "@/features/invitation-flow/types/invitation-flow.types";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

type IneligibleNoticeProps = {
  reason: EligibilityReason;
  eventName?: string;
};

export function IneligibleNotice({ reason, eventName }: IneligibleNoticeProps) {
  const { t } = useTranslation("invitation-flow");

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <AlertCircle className="size-6" />
        </span>
        <CardTitle className="mt-2 text-xl">
          {t(`ineligible.${reason}.title`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-center">
        {eventName && (
          <p className="text-sm font-medium text-foreground">{eventName}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {t(`ineligible.${reason}.message`)}
        </p>
      </CardContent>
    </Card>
  );
}
