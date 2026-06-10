import { useTranslation } from "react-i18next"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RosterClient } from "@/features/roster/types/roster.types"

type RosterViewProps = {
  clients: RosterClient[]
}

export function RosterView({ clients }: RosterViewProps) {
  const { t } = useTranslation("roster")

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("view.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("view.count", { count: clients.length })}
        </p>
      </div>

      {clients.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
          {t("view.empty")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("view.table.name")}</TableHead>
              <TableHead>{t("view.table.email")}</TableHead>
              <TableHead>{t("view.table.company")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="truncate">{client.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {client.company ?? t("view.noCompany")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
