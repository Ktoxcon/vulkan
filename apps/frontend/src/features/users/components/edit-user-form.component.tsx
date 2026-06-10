import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  editUserSchema,
  type EditUserFormValues,
} from "@/features/users/schemas/user.schema"
import {
  roleOptions,
  statusOptions,
} from "@/features/users/constants/user.constants"
import type {
  UpdateUserInput,
  User,
} from "@/features/users/types/user.types"
import { ApiError } from "@/lib/errors/api.error"
import { resolveError } from "@/lib/errors/resolve-error"

type EditUserFormProps = {
  user: User
  onSubmit: (values: UpdateUserInput) => void
  pending: boolean
  error?: unknown
  lockRole?: boolean
}

export function EditUserForm({
  user,
  onSubmit,
  pending,
  error,
  lockRole,
}: EditUserFormProps) {
  const { t } = useTranslation("users")
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      password: "",
    },
  })

  useEffect(() => {
    if (error instanceof ApiError && error.code === "USER_ALREADY_EXISTS") {
      form.setError("name", { type: "server", message: error.message })
    }
  }, [error, form])

  const handleSubmit = (values: EditUserFormValues) => {
    const patch: UpdateUserInput = {
      name: values.name,
      lastName: values.lastName,
      role: values.role,
      status: values.status,
    }
    if (values.password) {
      patch.password = values.password
    }
    onSubmit(patch)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.name.label")}</FormLabel>
                <FormControl>
                  <Input autoComplete="given-name" className="h-11" {...field} />
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
                <FormLabel>{t("form.lastName.label")}</FormLabel>
                <FormControl>
                  <Input autoComplete="family-name" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormItem>
          <FormLabel>{t("form.email.label")}</FormLabel>
          <FormControl>
            <Input
              type="email"
              value={user.email}
              readOnly
              disabled
              className="h-11"
            />
          </FormControl>
        </FormItem>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.resetPassword.label")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("form.resetPassword.placeholder")}
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.role.label")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder={t("form.role.placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={lockRole && option.value !== "admin"}
                      >
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lockRole && (
                  <p className="text-sm text-muted-foreground">
                    {t("form.role.lockedHint")}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.status.label")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder={t("form.status.placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={lockRole && option.value === "INACTIVE"}
                      >
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lockRole && (
                  <p className="text-sm text-muted-foreground">
                    {t("form.status.lockedHint")}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {Boolean(error) && !form.formState.errors.name && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {resolveError(error)}
          </p>
        )}
        <Button type="submit" className="h-11 w-full sm:w-auto" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {t("form.submit.edit")}
        </Button>
      </form>
    </Form>
  )
}
