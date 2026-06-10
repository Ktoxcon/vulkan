import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useConfirmRosterImport } from "@/features/roster/hooks/roster-import.hook"
import { ImportCounter } from "@/features/roster/components/import-counter.component"
import type { ImportRecord } from "@/features/roster/types/roster.types"
import { resolveError } from "@/lib/errors/resolve-error"

type RosterImportPreviewProps = {
  eventId: string
  record: ImportRecord
  onCancel: () => void
  onConfirmed: () => void
}

export function RosterImportPreview({
  eventId,
  record,
  onCancel,
  onConfirmed,
}: RosterImportPreviewProps) {
  const { t } = useTranslation("roster")
  const confirmImport = useConfirmRosterImport(eventId)

  const confirm = () => {
    confirmImport.mutate(record.id, {
      onSuccess: () => {
        toast.success(
          t("preview.toast.confirmed", { count: record.acceptedCount }),
        )
        onConfirmed()
      },
      onError: (error) => toast.error(resolveError(error)),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("preview.title")}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{record.fileName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ImportCounter
          label={t("preview.counter.imported")}
          value={record.importedCount}
        />
        <ImportCounter
          label={t("preview.counter.accepted")}
          value={record.acceptedCount}
        />
        <ImportCounter
          label={t("preview.counter.invalid")}
          value={record.invalidCount}
        />
        <ImportCounter
          label={t("preview.counter.duplicate")}
          value={record.duplicateCount}
        />
      </div>

      {record.invalidRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              {t("preview.invalidRows.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("preview.invalidRows.row")}</TableHead>
                  <TableHead>{t("preview.invalidRows.raw")}</TableHead>
                  <TableHead>{t("preview.invalidRows.errors")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.invalidRows.map((row) => (
                  <TableRow key={`invalid-${row.rowNumber}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell className="max-w-[12rem] truncate font-mono text-xs">
                      {Object.values(row.raw).join(", ")}
                    </TableCell>
                    <TableCell className="text-xs text-destructive">
                      {row.errors.join(", ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {record.duplicateRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("preview.duplicateRows.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("preview.duplicateRows.row")}</TableHead>
                  <TableHead>{t("preview.duplicateRows.email")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.duplicateRows.map((row) => (
                  <TableRow key={`duplicate-${row.rowNumber}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell className="truncate">{row.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="h-11 w-full sm:w-auto"
          onClick={onCancel}
          disabled={confirmImport.isPending}
        >
          {t("preview.cancel")}
        </Button>
        <Button
          className="h-11 w-full sm:w-auto"
          onClick={confirm}
          disabled={confirmImport.isPending || record.acceptedCount === 0}
        >
          {confirmImport.isPending && <Loader2 className="animate-spin" />}
          {t("preview.confirm")}
        </Button>
      </div>
    </div>
  )
}
