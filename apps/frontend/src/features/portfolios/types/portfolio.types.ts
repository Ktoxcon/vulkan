export type PortfolioStatus =
  | "draft"
  | "reviewed"
  | "sent"
  | "accepted"
  | "rejected"
  | "closed"

export type PortfolioListRow = {
  id: string
  status: PortfolioStatus
  clientName: string
  clientEmail: string
  eventName: string
  attendanceDate: string
  totalBeforeDiscount: string
  totalDiscountAmount: string
  totalAfterDiscount: string
  createdAt: string
}

export type PortfolioItem = {
  id: string
  portfolioId: string
  offeringId: string
  offeringName: string
  offeringType: "product" | "service"
  basePrice: string
  discountPercentage: number
  discountAmount: string
  finalPrice: string
  createdAt: string
  updatedAt: string
}

export type Portfolio = {
  id: string
  eventId: string
  clientId: string
  attendanceConfirmationId: string
  ownerId: string
  status: PortfolioStatus
  serviceSubtotal: string
  serviceDiscountPercentage: number
  serviceDiscountAmount: string
  serviceTotalAfterDiscount: string
  productSubtotal: string
  productDiscountPercentage: number
  productDiscountAmount: string
  productTotalAfterDiscount: string
  totalBeforeDiscount: string
  totalDiscountAmount: string
  totalAfterDiscount: string
  reviewedAt: string | null
  reviewedBy: string | null
  sentAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PortfolioClient = {
  name: string
  email: string
}

export type PortfolioEvent = {
  id: string
  name: string
}

export type PortfolioDetail = Portfolio & {
  client: PortfolioClient
  event: PortfolioEvent
  attendanceDate: string
  items: PortfolioItem[]
}

export type DiscountPreviewCategory = {
  count: number
  subtotal: string
  discountPercentage: number
  discountAmount: string
  totalAfterDiscount: string
}

export type DiscountPreview = {
  services: DiscountPreviewCategory
  products: DiscountPreviewCategory
  totalBeforeDiscount: string
  totalDiscountAmount: string
  totalAfterDiscount: string
}
