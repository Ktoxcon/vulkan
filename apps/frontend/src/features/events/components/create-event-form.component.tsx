import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  createEventSchema,
  type CreateEventFormValues,
} from "@/features/events/schemas/event.schema"
import { toIso } from "@/features/events/lib/event-datetime"
import type { CreateEventInput } from "@/features/events/types/event.types"
import { resolveError } from "@/lib/errors/resolve-error"

type CreateEventFormProps = {
  onSubmit: (values: CreateEventInput) => void
  pending: boolean
  error?: unknown
}

export function CreateEventForm({
  onSubmit,
  pending,
  error,
}: CreateEventFormProps) {
  const { t } = useTranslation("events")
  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 1,
      reservationTimeoutMinutes: 30,
      requireConfirmation: false,
      eventStartDate: "",
      eventEndDate: "",
      registrationStartDate: "",
      registrationEndDate: "",
    },
  })

  const handleSubmit = (values: CreateEventFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description || undefined,
      capacity: values.capacity,
      reservationTimeoutMinutes: values.reservationTimeoutMinutes,
      requireConfirmation: values.requireConfirmation,
      eventStartDate: toIso(values.eventStartDate) as string,
      eventEndDate: toIso(values.eventEndDate ?? ""),
      registrationStartDate: toIso(values.registrationStartDate) as string,
      registrationEndDate: toIso(values.registrationEndDate) as string,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.name.label")}</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.description.label")}</FormLabel>
              <FormControl>
                <Input className="h-11" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.capacity.label")}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reservationTimeoutMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.reservationTimeoutMinutes.label")}</FormLabel>
                <FormControl>
                  <Input type="number" min={0} className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="registrationStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.registrationStartDate.label")}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registrationEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.registrationEndDate.label")}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eventStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.eventStartDate.label")}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eventEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.eventEndDate.label")}</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    className="h-11"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="requireConfirmation"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  className="size-5 accent-primary"
                  checked={field.value ?? false}
                  onChange={(event) => field.onChange(event.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormLabel className="font-normal">
                {t("form.requireConfirmation.label")}
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        {Boolean(error) && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {resolveError(error)}
          </p>
        )}
        <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {t("form.create")}
        </Button>
      </form>
    </Form>
  )
}
