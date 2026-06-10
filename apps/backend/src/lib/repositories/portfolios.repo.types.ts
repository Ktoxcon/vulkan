import type { PortfolioStatus } from "@vulkan/lib/constants/portfolio-status.types";

export type PortfolioListRow = {
  id: string;
  status: string;
  clientName: string;
  clientEmail: string;
  eventName: string;
  attendanceDate: Date;
  totalBeforeDiscount: string;
  totalDiscountAmount: string;
  totalAfterDiscount: string;
  createdAt: Date;
};

export type PortfolioDetailClient = {
  name: string;
  email: string;
};

export type PortfolioDetailEvent = {
  id: string;
  name: string;
};

export type PortfolioDetail = {
  id: string;
  eventId: string;
  clientId: string;
  attendanceConfirmationId: string;
  ownerId: string;
  status: string;
  serviceSubtotal: string;
  serviceDiscountPercentage: number;
  serviceDiscountAmount: string;
  serviceTotalAfterDiscount: string;
  productSubtotal: string;
  productDiscountPercentage: number;
  productDiscountAmount: string;
  productTotalAfterDiscount: string;
  totalBeforeDiscount: string;
  totalDiscountAmount: string;
  totalAfterDiscount: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client: PortfolioDetailClient;
  event: PortfolioDetailEvent;
  attendanceDate: Date;
};

export type PortfolioStatusTimestamps = {
  reviewedAt?: Date;
  reviewedBy?: string;
  sentAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  closedAt?: Date;
};

export type SetPortfolioStatusInput = {
  toStatus: PortfolioStatus;
  timestamps: PortfolioStatusTimestamps;
};
