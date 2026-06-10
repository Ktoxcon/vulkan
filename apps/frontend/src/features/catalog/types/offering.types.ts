export type OfferingType = "product" | "service"

export type OfferingStatusFilter = "active" | "inactive" | "all"

export type Offering = {
  id: string
  type: OfferingType
  name: string
  description: string | null
  basePrice: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type OfferingListResult = {
  count: number
  items: Offering[]
}

export type CreateOfferingInput = {
  type: OfferingType
  name: string
  description?: string
  basePrice: number
  isActive?: boolean
}

export type UpdateOfferingInput = {
  name?: string
  description?: string
  basePrice?: number
  isActive?: boolean
}

export type OfferingValidRow = {
  name: string
  type: OfferingType
  description: string | null
  basePrice: string
}

export type OfferingInvalidRow = {
  rowNumber: number
  raw: Record<string, string>
  errors: string[]
}

export type OfferingDuplicateRow = {
  rowNumber: number
  name: string
  type: OfferingType
}

export type OfferingImportRecord = {
  id: string
  status: "pending" | "confirmed"
  fileName: string
  processedCount: number
  importedCount: number
  duplicateCount: number
  invalidCount: number
  validRows: OfferingValidRow[]
  invalidRows: OfferingInvalidRow[]
  duplicateRows: OfferingDuplicateRow[]
}
