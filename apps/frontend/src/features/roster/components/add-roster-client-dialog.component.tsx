import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAddRosterClient } from "@/features/roster/hooks/add-roster-client.hook"
import {
  addRosterClientSchema,
  type AddRosterClientValues,
} from "@/features/roster/schemas/roster.schema"
import { ApiError } from "@/lib/errors/api.error"

type AddRosterClientDialogProps = {
  eventId: string
}

export function AddRosterClientDialog({ eventId }: AddRosterClientDialogProps) {
  const { t } = useTranslation("roster")
  const [open, setOpen] = useState(false)
  const addClient = useAddRosterClient(eventId)

  const form = useForm<AddRosterClientValues>({
    resolver: zodResolver(addRosterClientSchema),
    defaultValues: { name: "", email: "", company: "" },
  })

  useEffect(() => {
    if (
      addClient.error instanceof ApiError &&
      addClient.error.code === "ROSTER_CLIENT_DUPLICATE"
    ) {
      form.setError("email", { type: "server", message: addClient.error.message })
    }
  }, [addClient.error, form])

  const handleSubmit = (values: AddRosterClientValues) => {
    addClient.mutate(
      {
        name: values.name,
        email: values.email,
        company: values.company?.trim() ? values.company.trim() : null,
      },
      {
        onSuccess: () => {
          toast.success(t("addClient.toast.added"))
          form.reset()
          setOpen(false)
        },
      },
    )
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset()
      addClient.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-11 w-full shrink-0 sm:w-auto md:h-9">
          <UserPlus />
          {t("addClient.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addClient.title")}</DialogTitle>
          <DialogDescription>{t("addClient.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("addClient.name.label")}</FormLabel>
                  <FormControl>
                    <Input className="h-11" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("addClient.email.label")}</FormLabel>
                  <FormControl>
                    <Input className="h-11" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("addClient.company.label")}</FormLabel>
                  <FormControl>
                    <Input className="h-11" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="h-11 w-full sm:w-auto sm:self-end"
              disabled={addClient.isPending}
            >
              {addClient.isPending && <Loader2 className="animate-spin" />}
              {t("addClient.submit")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
