import { Loader2, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useGenerateInvitations } from "@/features/invitations/hooks/generate-invitations.hook"
import { ApiError } from "@/lib/errors/api.error"
import { resolveError } from "@/lib/errors/resolve-error"

type GenerateInvitationsProps = {
  eventId: string
}

export function GenerateInvitations({ eventId }: GenerateInvitationsProps) {
  const { t } = useTranslation("invitations")
  const generate = useGenerateInvitations(eventId)

  const run = () => {
    generate.mutate(undefined, {
      onSuccess: (result) =>
        toast.success(
          t("generate.toast.success", {
            createdCount: result.createdCount,
            totalRosterClients: result.totalRosterClients,
          })
        ),
      onError: (error) =>
        toast.error(
          error instanceof ApiError &&
            error.code === "INVITATIONS_ROSTER_MISSING"
            ? t("generate.toast.rosterMissing")
            : resolveError(error)
        ),
    })
  }

  return (
    <Button
      className="h-11 w-full sm:w-auto"
      onClick={run}
      disabled={generate.isPending}
    >
      {generate.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
      {t("generate.action")}
    </Button>
  )
}
