import { Button } from "@/components/ui/button";
import { ReviewRow } from "@/features/invitation-flow/components/review-row.component";
import type { PersonalInfoInput } from "@/features/invitation-flow/schemas/invitation-flow.schema";
import type { ClientOffering } from "@/features/invitation-flow/types/invitation-flow.types";
import { formatDate } from "@/lib/formatters/date.formatter";
import { LONG_DATE_NO_YEAR } from "@/lib/formatters/date.formatter.constants";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type ReviewStepProps = {
  personalInfo: PersonalInfoInput;
  selectedOfferings: ClientOffering[];
  errorMessage: string | null;
  isConfirming: boolean;
  canConfirm: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function ReviewStep({
  personalInfo,
  selectedOfferings,
  errorMessage,
  isConfirming,
  canConfirm,
  onBack,
  onConfirm,
}: ReviewStepProps) {
  const { t } = useTranslation("invitation-flow");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-md border border-border p-4">
        <ReviewRow
          label={t("review.name")}
          value={`${personalInfo.firstName} ${personalInfo.lastName}`}
        />
        <ReviewRow label={t("review.email")} value={personalInfo.email} />
        <ReviewRow
          label={t("review.attendanceDate")}
          value={formatDate(personalInfo.attendanceDate, LONG_DATE_NO_YEAR)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("review.interests")}
        </span>
        {selectedOfferings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("review.noInterests")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {selectedOfferings.map((offering) => (
              <li
                key={offering.id}
                className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
              >
                {offering.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          onClick={onBack}
          disabled={isConfirming}
        >
          {t("review.actions.back")}
        </Button>
        <Button
          type="button"
          className="h-11 flex-1"
          onClick={onConfirm}
          disabled={isConfirming || !canConfirm}
        >
          {isConfirming && <Loader2 className="animate-spin" />}
          {t("review.actions.confirm")}
        </Button>
      </div>
    </div>
  );
}
