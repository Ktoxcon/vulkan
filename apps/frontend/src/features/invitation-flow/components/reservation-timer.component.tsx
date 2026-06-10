import { Button } from "@/components/ui/button";
import { useReservationCountdown } from "@/features/invitation-flow/hooks/reservation.hook";
import { cn } from "@/lib/css/classes";
import { Loader2, RotateCw, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";

type ReservationTimerProps = {
  expiresAt: string | null;
  onReReserve: () => void;
  isReReserving: boolean;
};

export function ReservationTimer({
  expiresAt,
  onReReserve,
  isReReserving,
}: ReservationTimerProps) {
  const { t } = useTranslation("invitation-flow");
  const { remainingSeconds, isExpired } = useReservationCountdown(expiresAt);

  if (!expiresAt || isExpired) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-center">
        <p className="text-sm font-medium text-destructive">
          {t("reservation.expired")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={onReReserve}
          disabled={isReReserving}
        >
          {isReReserving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RotateCw className="size-4" />
          )}
          {t("reservation.reReserve")}
        </Button>
      </div>
    );
  }

  const isLow = remainingSeconds <= 60;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const remainingLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm",
        isLow
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      <Timer className="size-4" />
      <span>
        {t("reservation.held")}{" "}
        <span className="font-semibold tabular-nums">{remainingLabel}</span>
      </span>
    </div>
  );
}
