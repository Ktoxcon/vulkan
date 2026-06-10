import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from "react-i18next"
import { InvitationStatusBadge } from "@/features/invitations/components/invitation-status-badge.component"
import {
  INVITATION_STATUS_ALL,
  InvitationStatus,
  statusLabelKeys,
} from "@/features/invitations/constants/invitation.constants"
import type {
  InvitationListItem,
  InvitationStatus as InvitationStatusType,
} from "@/features/invitations/types/invitation.types"
import { formatDate } from "@/lib/formatters/date.formatter"

type InvitationsTableProps = {
  invitations: InvitationListItem[]
  status: InvitationStatusType | undefined
  onStatusChange: (status: InvitationStatusType | undefined) => void
}

export function InvitationsTable({
  invitations,
  status,
  onStatusChange,
}: InvitationsTableProps) {
  const { t } = useTranslation("invitations")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t("table.title")}</h2>
        <Select
          value={status ?? INVITATION_STATUS_ALL}
          onValueChange={(value) =>
            onStatusChange(
              value === INVITATION_STATUS_ALL
                ? undefined
                : (value as InvitationStatusType)
            )
          }
        >
          <SelectTrigger className="h-11 w-full sm:w-48 md:h-9">
            <SelectValue placeholder={t("table.filter.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={INVITATION_STATUS_ALL}>{t("table.filter.all")}</SelectItem>
            {Object.values(InvitationStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {t(statusLabelKeys[value])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {invitations.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
          {t("table.empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.header.email")}</TableHead>
              <TableHead>{t("table.header.status")}</TableHead>
              <TableHead>{t("table.header.sent")}</TableHead>
              <TableHead>{t("table.header.opened")}</TableHead>
              <TableHead>{t("table.header.confirmed")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((item) => (
              <TableRow key={item.invitation.id}>
                <TableCell className="truncate font-medium">
                  {item.client.email}
                </TableCell>
                <TableCell>
                  <InvitationStatusBadge status={item.invitation.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(item.invitation.sentAt ?? undefined)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(item.invitation.openedAt ?? undefined)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(item.invitation.confirmedAt ?? undefined)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
