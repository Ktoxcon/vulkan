import type {
  CreateOfferingInput,
  Offering,
  OfferingListResult,
  UpdateOfferingInput,
} from "@/features/catalog/types/offering.types"
import { request } from "@/lib/clients/http.client"

async function list(params: {
  type?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}): Promise<OfferingListResult> {
  const query = new URLSearchParams()

  if (params.type !== undefined) query.set("type", params.type)
  if (params.isActive !== undefined) query.set("isActive", String(params.isActive))
  if (params.search !== undefined) query.set("search", params.search)
  if (params.limit !== undefined) query.set("limit", String(params.limit))
  if (params.offset !== undefined) query.set("offset", String(params.offset))

  const queryString = query.toString()
  return request<OfferingListResult>(
    queryString ? `/offerings?${queryString}` : "/offerings"
  )
}

async function getById(id: string): Promise<Offering> {
  return request<Offering>(`/offerings/${id}`)
}

async function create(input: CreateOfferingInput): Promise<Offering> {
  return request<Offering>("/offerings", { method: "POST", body: input })
}

async function update(id: string, partial: UpdateOfferingInput): Promise<Offering> {
  return request<Offering>(`/offerings/${id}`, { method: "PATCH", body: partial })
}

async function deactivate(id: string): Promise<Offering> {
  return request<Offering>(`/offerings/${id}`, { method: "DELETE" })
}

export const OfferingsClient = { list, getById, create, update, deactivate }
