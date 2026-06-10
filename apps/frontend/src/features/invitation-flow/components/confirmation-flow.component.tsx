import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationSuccess } from "@/features/invitation-flow/components/confirmation-success.component";
import { InterestsStep } from "@/features/invitation-flow/components/interests-step.component";
import { PersonalInfoStep } from "@/features/invitation-flow/components/personal-info-step.component";
import { ReservationTimer } from "@/features/invitation-flow/components/reservation-timer.component";
import { ReviewStep } from "@/features/invitation-flow/components/review-step.component";
import { StepIndicator } from "@/features/invitation-flow/components/step-indicator.component";
import { useConfirm } from "@/features/invitation-flow/hooks/confirm.hook";
import {
  useDraft,
  useSaveDraft,
} from "@/features/invitation-flow/hooks/draft.hook";
import { useInvitationOfferings } from "@/features/invitation-flow/hooks/invitation-offerings.hook";
import { useCreateReservation } from "@/features/invitation-flow/hooks/reservation.hook";
import {
  personalInfoSchema,
  type PersonalInfoInput,
} from "@/features/invitation-flow/schemas/invitation-flow.schema";
import type {
  ClientContext,
  ClientOffering,
  ConfirmationResult,
  EventContext,
} from "@/features/invitation-flow/types/invitation-flow.types";
import { ApiError } from "@/lib/errors/api.error";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type ConfirmationFlowProps = {
  token: string;
  event: EventContext;
  client: ClientContext;
  hasDraft: boolean;
};

export function ConfirmationFlow({
  token,
  event,
  client,
  hasDraft,
}: ConfirmationFlowProps) {
  const { t } = useTranslation("invitation-flow");
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [draftApplied, setDraftApplied] = useState(false);
  const [successResult, setSuccessResult] = useState<ConfirmationResult | null>(
    null,
  );

  const reservation = useCreateReservation(token);
  const offerings = useInvitationOfferings(token, true);
  const draft = useDraft(token, hasDraft);
  const saveDraft = useSaveDraft(token);
  const confirm = useConfirm(token);

  const defaultName = useMemo(() => {
    const trimmed = client.name.trim();

    if (!trimmed) return { firstName: "", lastName: "" };

    const spaceIndex = trimmed.indexOf(" ");

    if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };

    return {
      firstName: trimmed.slice(0, spaceIndex),
      lastName: trimmed.slice(spaceIndex + 1),
    };
  }, [client.name]);
  const defaultAttendanceDate = event.availableAttendanceDates[0] ?? "";

  const form = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: defaultName.firstName,
      lastName: defaultName.lastName,
      email: client.email,
      attendanceDate: defaultAttendanceDate,
    },
  });

  const reservationData = reservation.data;

  const startReservation = reservation.mutate;
  const hasReservation = Boolean(reservation.data);
  const reservationFailed = reservation.isError;
  const reservationPending = reservation.isPending;

  useEffect(() => {
    if (!reservationPending && !hasReservation && !reservationFailed) {
      startReservation();
    }
  }, [startReservation, hasReservation, reservationFailed, reservationPending]);

  useEffect(() => {
    if (!hasDraft || draftApplied || !draft.draft) return;

    const data = draft.draft;

    form.reset({
      firstName: data.firstName || defaultName.firstName,
      lastName: data.lastName || defaultName.lastName,
      email: data.email || client.email,
      attendanceDate: data.attendanceDate || defaultAttendanceDate,
    });

    if (data.productIds) setSelectedProductIds(data.productIds);
    if (data.serviceIds) setSelectedServiceIds(data.serviceIds);

    setDraftApplied(true);
  }, [
    hasDraft,
    draftApplied,
    draft.draft,
    form,
    client.email,
    defaultName,
    defaultAttendanceDate,
  ]);

  const saveDraftFn = saveDraft.save;

  useEffect(() => {
    const subscription = form.watch((values) => {
      saveDraftFn({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        attendanceDate: values.attendanceDate,
        productIds: selectedProductIds,
        serviceIds: selectedServiceIds,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraftFn, selectedProductIds, selectedServiceIds]);

  const persistSelection = (productIds: string[], serviceIds: string[]) => {
    const values = form.getValues();

    saveDraftFn({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      attendanceDate: values.attendanceDate,
      productIds,
      serviceIds,
    });
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((current) => {
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];

      persistSelection(next, selectedServiceIds);

      return next;
    });
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((current) => {
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
      persistSelection(selectedProductIds, next);
      return next;
    });
  };

  const selectedOfferings = useMemo<ClientOffering[]>(() => {
    const byProduct = offerings.products.filter((offering) =>
      selectedProductIds.includes(offering.id),
    );
    const byService = offerings.services.filter((offering) =>
      selectedServiceIds.includes(offering.id),
    );
    return [...byProduct, ...byService];
  }, [
    offerings.products,
    offerings.services,
    selectedProductIds,
    selectedServiceIds,
  ]);

  const reservationExpired = useMemo(() => {
    if (!reservationData) return false;
    return new Date(reservationData.expiresAt).getTime() <= Date.now();
  }, [reservationData]);

  const confirmErrorMessage = useMemo(() => {
    if (!confirm.error) return null;
    if (confirm.error instanceof ApiError) {
      return t(`confirm.error.${confirm.error.code}`, {
        defaultValue: confirm.error.message,
      });
    }

    return t("confirm.fallbackError");
  }, [confirm.error, t]);

  const handleConfirm = () => {
    const values = form.getValues();
    confirm.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        attendanceDate: values.attendanceDate,
        offeringIds: [...selectedProductIds, ...selectedServiceIds],
      },
      {
        onSuccess: (result) => {
          setSuccessResult(result);
          toast.success(t("toast.confirmed"));
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === "CAPACITY_REACHED") {
            toast.error(t("toast.full"));
          }
        },
      },
    );
  };

  if (successResult) {
    return <ConfirmationSuccess result={successResult} />;
  }

  if (reservation.isPending || (!reservationData && !reservation.isError)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("reservation.reserving")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (reservation.isError) {
    const isFull =
      reservation.error instanceof ApiError &&
      reservation.error.code === "CAPACITY_REACHED";

    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isFull
              ? t("reservation.error.fullTitle")
              : t("reservation.error.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {isFull
            ? t("reservation.error.fullMessage")
            : t("reservation.error.message")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <StepIndicator current={stepIndex} />
        <ReservationTimer
          expiresAt={reservationData?.expiresAt ?? null}
          onReReserve={() => reservation.mutate()}
          isReReserving={reservation.isPending}
        />
      </CardHeader>
      <CardContent>
        {stepIndex === 0 && (
          <PersonalInfoStep
            form={form}
            event={event}
            onNext={() => setStepIndex(1)}
          />
        )}
        {stepIndex === 1 && (
          <InterestsStep
            token={token}
            products={offerings.products}
            services={offerings.services}
            isLoading={offerings.isLoading}
            selectedProductIds={selectedProductIds}
            selectedServiceIds={selectedServiceIds}
            onToggleProduct={toggleProduct}
            onToggleService={toggleService}
            onBack={() => setStepIndex(0)}
            onNext={() => setStepIndex(2)}
          />
        )}
        {stepIndex === 2 && (
          <ReviewStep
            personalInfo={form.getValues()}
            selectedOfferings={selectedOfferings}
            errorMessage={
              reservationExpired ? t("confirm.expired") : confirmErrorMessage
            }
            isConfirming={confirm.isPending}
            canConfirm={!reservationExpired}
            onBack={() => setStepIndex(1)}
            onConfirm={handleConfirm}
          />
        )}
      </CardContent>
    </Card>
  );
}
