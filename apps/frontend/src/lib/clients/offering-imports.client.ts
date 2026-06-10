import type { OfferingImportRecord } from "@/features/catalog/types/offering.types"
import { request } from "@/lib/clients/http.client"

async function createImport(file: File): Promise<OfferingImportRecord> {
  const formData = new FormData()
  formData.append("file", file)

  return request<OfferingImportRecord>("/offering-imports", {
    method: "POST",
    body: formData,
  })
}

async function getImport(importId: string): Promise<OfferingImportRecord> {
  return request<OfferingImportRecord>(`/offering-imports/${importId}`)
}

async function confirmImport(importId: string): Promise<OfferingImportRecord> {
  return request<OfferingImportRecord>(`/offering-imports/${importId}`, {
    method: "PATCH",
    body: { status: "confirmed" },
  })
}

export const OfferingImportsClient = { createImport, getImport, confirmImport }
