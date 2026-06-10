import { useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { OfferingImportUpload } from "@/features/catalog/components/offering-import-upload.component"
import { OfferingImportPreview } from "@/features/catalog/components/offering-import-preview.component"
import {
  useConfirmOfferingImport,
  useCreateOfferingImport,
} from "@/features/catalog/hooks/offering-import.hook"
import { Routes } from "@/lib/constants/routes.constants"
import { resolveError } from "@/lib/errors/resolve-error"
import type { OfferingImportRecord } from "@/features/catalog/types/offering.types"

export function OfferingImportPage() {
  const { t } = useTranslation("catalog")
  const [record, setRecord] = useState<OfferingImportRecord | null>(null)
  const [summary, setSummary] = useState<OfferingImportRecord | null>(null)
  const createImport = useCreateOfferingImport()
  const confirmImport = useConfirmOfferingImport()

  const onUpload = (file: File) => {
    createImport.mutate(file, {
      onSuccess: (preview) => {
        setSummary(null)
        setRecord(preview)
      },
      onError: (error) => toast.error(resolveError(error)),
    })
  }

  const onConfirm = () => {
    if (!record) return
    confirmImport.mutate(record.id, {
      onSuccess: (committed) => {
        toast.success(t("toast.imported", { count: committed.importedCount }))
        setRecord(null)
        setSummary(committed)
      },
      onError: (error) => toast.error(resolveError(error)),
    })
  }

  const reset = () => {
    setRecord(null)
    setSummary(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-11 w-fit px-2 md:h-9"
        >
          <Link to={Routes.catalog}>
            <ArrowLeft />
            {t("actions.backToCatalog")}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          {t("import.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("import.subtitle")}
        </p>
      </div>

      {summary ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="size-6" />
            <h2 className="text-lg font-semibold">{t("import.summary.title")}</h2>
          </div>
          <dl className="grid w-full gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t("import.summary.imported")}</dt>
              <dd className="text-lg font-medium">{summary.importedCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("import.summary.duplicatesSkipped")}</dt>
              <dd className="text-lg font-medium">{summary.duplicateCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("import.summary.invalidRows")}</dt>
              <dd className="text-lg font-medium">{summary.invalidCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("import.summary.processed")}</dt>
              <dd className="text-lg font-medium">{summary.processedCount}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="h-11 md:h-9">
              <Link to={Routes.catalog}>{t("import.summary.backToCatalog")}</Link>
            </Button>
            <Button
              variant="outline"
              className="h-11 md:h-9"
              onClick={reset}
            >
              {t("import.summary.importAnother")}
            </Button>
          </div>
        </div>
      ) : record ? (
        <OfferingImportPreview
          record={record}
          onConfirm={onConfirm}
          onCancel={reset}
          pending={confirmImport.isPending}
        />
      ) : (
        <OfferingImportUpload
          onUpload={onUpload}
          pending={createImport.isPending}
        />
      )}
    </div>
  )
}
