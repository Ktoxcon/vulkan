import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonalInfoInput } from "@/features/invitation-flow/schemas/invitation-flow.schema";
import type { EventContext } from "@/features/invitation-flow/types/invitation-flow.types";
import { formatDate } from "@/lib/formatters/date.formatter";
import { SHORT_WEEKDAY_DATE } from "@/lib/formatters/date.formatter.constants";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

type PersonalInfoStepProps = {
  form: UseFormReturn<PersonalInfoInput>;
  event: EventContext;
  onNext: () => void;
};

export function PersonalInfoStep({
  form,
  event,
  onNext,
}: PersonalInfoStepProps) {
  const { t } = useTranslation("invitation-flow");

  const handleNext = async () => {
    const valid = await form.trigger();

    if (valid) onNext();
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(submitEvent) => submitEvent.preventDefault()}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("personalInfo.firstName.label")}</FormLabel>
                <FormControl>
                  <Input
                    className="h-11"
                    autoComplete="given-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("personalInfo.lastName.label")}</FormLabel>
                <FormControl>
                  <Input
                    className="h-11"
                    autoComplete="family-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("personalInfo.email.label")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  className="h-11"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="attendanceDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("personalInfo.attendanceDate.label")}</FormLabel>
              {event.isMultiDay ? (
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue
                        placeholder={t(
                          "personalInfo.attendanceDate.placeholder",
                        )}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {event.availableAttendanceDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {formatDate(date, SHORT_WEEKDAY_DATE)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input
                    className="h-11"
                    readOnly
                    value={formatDate(field.value, SHORT_WEEKDAY_DATE)}
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="button" className="h-11 w-full" onClick={handleNext}>
          {t("personalInfo.actions.continue")}
        </Button>
      </form>
    </Form>
  );
}
