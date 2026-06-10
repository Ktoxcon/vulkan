import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfirmationResult } from "@/features/invitation-flow/types/invitation-flow.types";
import { formatDate } from "@/lib/formatters/date.formatter";
import { LONG_DATE } from "@/lib/formatters/date.formatter.constants";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type ConfirmationSuccessProps = {
  result: ConfirmationResult;
};

export function ConfirmationSuccess({ result }: ConfirmationSuccessProps) {
  const { t } = useTranslation("invitation-flow");
  const interests = [
    ...result.interests.products,
    ...result.interests.services,
  ];

  return (
    <Card>
      <CardHeader className="justify-center text-center">
        <div className="flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-8" />
          </span>
        </div>

        <CardTitle className="mt-2 text-xl">{t("success.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-base font-semibold text-foreground">
            {result.event.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(result.attendanceDate, LONG_DATE)}
          </p>
        </div>

        {interests.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {t("success.interests")}
            </p>
            <ul className="flex flex-col gap-1">
              {interests.map((interest) => (
                <li
                  key={interest.offeringId}
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
                >
                  {interest.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {result.message}
        </p>
      </CardContent>
    </Card>
  );
}
