import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  editOfferingSchema,
  type EditOfferingFormOutput,
  type EditOfferingFormValues,
} from "@/features/catalog/schemas/offering.schema"
import { formatOfferingType } from "@/features/catalog/formatters/offering-type.formatter"
import type {
  Offering,
  UpdateOfferingInput,
} from "@/features/catalog/types/offering.types"
import { ApiError } from "@/lib/errors/api.error"
import { resolveError } from "@/lib/errors/resolve-error"

type EditOfferingFormProps = {
  offering: Offering
  onSubmit: (values: UpdateOfferingInput) => void
  pending: boolean
  error?: unknown
}

export function EditOfferingForm({
  offering,
  onSubmit,
  pending,
  error,
}: EditOfferingFormProps) {
  const { t } = useTranslation("catalog")
  const form = useForm<EditOfferingFormValues, unknown, EditOfferingFormOutput>({
    resolver: zodResolver(editOfferingSchema),
    defaultValues: {
      name: offering.name,
      description: offering.description ?? "",
      basePrice: Number(offering.basePrice),
      isActive: offering.isActive,
    },
  })

  useEffect(() => {
    if (error instanceof ApiError && error.code === "DUPLICATE_OFFERING") {
      form.setError("name", { type: "server", message: error.message })
    }
  }, [error, form])

  const handleSubmit = (values: EditOfferingFormOutput) => {
    onSubmit({
      name: values.name,
      description: values.description,
      basePrice: values.basePrice,
      isActive: values.isActive,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <FormItem>
          <FormLabel>{t("form.type.label")}</FormLabel>
          <FormControl>
            <Input
              value={formatOfferingType(offering.type)}
              readOnly
              disabled
              className="h-11"
            />
          </FormControl>
          <FormDescription>{t("form.type.readOnlyDescription")}</FormDescription>
        </FormItem>
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
                <Textarea rows={4} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.basePrice.label")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="h-11"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === "" ? undefined : event.target.valueAsNumber
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between gap-4 rounded-md border border-border p-4">
              <div className="space-y-1">
                <FormLabel>{t("form.isActive.label")}</FormLabel>
                <FormDescription>
                  {t("form.isActive.description")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {Boolean(error) && !form.formState.errors.name && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {resolveError(error)}
          </p>
        )}
        <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {t("form.submit.save")}
        </Button>
      </form>
    </Form>
  )
}
