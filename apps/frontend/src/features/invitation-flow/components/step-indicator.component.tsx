import { stepIndicatorSteps } from "@/features/invitation-flow/constants/invitation-flow.constants";
import { cn } from "@/lib/css/classes";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

type StepIndicatorProps = {
  current: number;
};

export function StepIndicator({ current }: StepIndicatorProps) {
  const { t } = useTranslation("invitation-flow");

  return (
    <ol className="flex items-center justify-between gap-2">
      {stepIndicatorSteps.map((step, index) => {
        const isComplete = index < current;
        const isActive = index === current;

        return (
          <li
            key={step.key}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex w-full justify-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  isComplete &&
                    "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary text-primary",
                  !isComplete &&
                    !isActive &&
                    "border-border text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="size-4" /> : index + 1}
              </span>
            </div>
            <span
              className={cn(
                "text-center text-xs",
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {t(step.labelKey)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
