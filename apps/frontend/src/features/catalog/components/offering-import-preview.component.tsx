import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Counter } from "@/features/catalog/components/import-counter.component";
import { formatOfferingType } from "@/features/catalog/formatters/offering-type.formatter";
import type { OfferingImportRecord } from "@/features/catalog/types/offering.types";
import { Loader2 } from "lucide-react";

type OfferingImportPreviewProps = {
  record: OfferingImportRecord;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function OfferingImportPreview({
  record,
  pending,
  onCancel,
  onConfirm,
}: OfferingImportPreviewProps) {
  const { t } = useTranslation("catalog")
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("import.preview.title")}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {record.fileName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Counter label={t("import.preview.counters.processed")} value={record.processedCount} />
        <Counter label={t("import.preview.counters.imported")} value={record.importedCount} />
        <Counter label={t("import.preview.counters.duplicate")} value={record.duplicateCount} />
        <Counter label={t("import.preview.counters.invalid")} value={record.invalidCount} />
      </div>

      {record.invalidRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              {t("import.preview.invalidRows.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("import.preview.invalidRows.row")}</TableHead>
                    <TableHead>{t("import.preview.invalidRows.raw")}</TableHead>
                    <TableHead>{t("import.preview.invalidRows.errors")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.invalidRows.map((row) => (
                    <TableRow key={`invalid-${row.rowNumber}`}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="max-w-48 truncate font-mono text-xs">
                        {Object.values(row.raw).join(", ")}
                      </TableCell>
                      <TableCell className="text-xs text-destructive">
                        {row.errors.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {record.duplicateRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("import.preview.duplicateRows.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("import.preview.duplicateRows.row")}</TableHead>
                    <TableHead>{t("import.preview.duplicateRows.name")}</TableHead>
                    <TableHead>{t("import.preview.duplicateRows.type")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.duplicateRows.map((row) => (
                    <TableRow key={`duplicate-${row.rowNumber}`}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell className="truncate">{row.name}</TableCell>
                      <TableCell>{formatOfferingType(row.type)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="h-11 w-full sm:w-auto"
          onClick={onCancel}
          disabled={pending}
        >
          {t("import.preview.cancel")}
        </Button>
        <Button
          className="h-11 w-full sm:w-auto"
          onClick={onConfirm}
          disabled={pending || record.validRows.length === 0}
        >
          {pending && <Loader2 className="animate-spin" />}
          {t("import.preview.confirm")}
        </Button>
      </div>
    </div>
  );
}
