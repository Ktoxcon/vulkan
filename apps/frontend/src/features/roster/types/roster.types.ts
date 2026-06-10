export type ImportStatus = "pending" | "confirmed"

export type ValidRow = {
  name: string
  email: string
  company: string | null
}

export type InvalidRow = {
  rowNumber: number
  raw: Record<string, string>
  errors: string[]
}

export type DuplicateRow = {
  rowNumber: number
  email: string
}

export type ImportRecord = {
  id: string
  status: ImportStatus
  fileName: string
  importedCount: number
  invalidCount: number
  duplicateCount: number
  acceptedCount: number
  validRows: ValidRow[]
  invalidRows: InvalidRow[]
  duplicateRows: DuplicateRow[]
}

export type Roster = {
  id: string
  eventId: string
  createdAt: string
  updatedAt: string
}

export type RosterClient = {
  id: string
  name: string
  email: string
  company: string | null
}

export type RosterView = {
  roster: Roster
  clients: RosterClient[]
}

export type AddRosterClientInput = {
  name: string
  email: string
  company: string | null
}

export type RosterMember = {
  rosterClientId: string
  clientId: string
  name: string
  email: string
  company: string | null
  createdAt: string
}
