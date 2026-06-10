import { db } from "@vulkan/lib/db/index";
import { attendanceConfirmations } from "@vulkan/lib/db/schema/attendance-confirmations";
import { portfolios } from "@vulkan/lib/db/schema/portfolios";
import type {
  NewPortfolio,
  Portfolio,
} from "@vulkan/lib/db/schema/portfolios.types";
import { salesEvents } from "@vulkan/lib/db/schema/sales-events";
import type { DbExecutor } from "@vulkan/lib/repositories/capacity.repo.types";
import type {
  PortfolioDetail,
  PortfolioListRow,
  SetPortfolioStatusInput,
} from "@vulkan/lib/repositories/portfolios.repo.types";
import { desc, eq, sql } from "drizzle-orm";

export const PortfoliosRepository = {
  async create(
    values: NewPortfolio,
    executor: DbExecutor = db,
  ): Promise<Portfolio> {
    const [row] = await executor.insert(portfolios).values(values).returning();
    return row as Portfolio;
  },

  async findById(
    id: string,
    executor: DbExecutor = db,
  ): Promise<Portfolio | undefined> {
    const [row] = await executor
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, id))
      .limit(1);
    return row;
  },

  async findByConfirmationId(
    confirmationId: string,
    executor: DbExecutor = db,
  ): Promise<Portfolio | undefined> {
    const [row] = await executor
      .select()
      .from(portfolios)
      .where(eq(portfolios.attendanceConfirmationId, confirmationId))
      .limit(1);
    return row;
  },

  async listByEvent(
    eventId: string,
    executor: DbExecutor = db,
  ): Promise<PortfolioListRow[]> {
    const rows = await executor
      .select({
        id: portfolios.id,
        status: portfolios.status,
        clientName: sql<string>`${attendanceConfirmations.firstName} || ' ' || ${attendanceConfirmations.lastName}`,
        clientEmail: attendanceConfirmations.email,
        eventName: salesEvents.name,
        attendanceDate: attendanceConfirmations.attendanceDate,
        totalBeforeDiscount: portfolios.totalBeforeDiscount,
        totalDiscountAmount: portfolios.totalDiscountAmount,
        totalAfterDiscount: portfolios.totalAfterDiscount,
        createdAt: portfolios.createdAt,
      })
      .from(portfolios)
      .innerJoin(salesEvents, eq(portfolios.eventId, salesEvents.id))
      .innerJoin(
        attendanceConfirmations,
        eq(portfolios.attendanceConfirmationId, attendanceConfirmations.id),
      )
      .where(eq(portfolios.eventId, eventId))
      .orderBy(desc(portfolios.createdAt));
    return rows;
  },

  async getDetail(
    id: string,
    executor: DbExecutor = db,
  ): Promise<PortfolioDetail | undefined> {
    const [row] = await executor
      .select({
        id: portfolios.id,
        eventId: portfolios.eventId,
        clientId: portfolios.clientId,
        attendanceConfirmationId: portfolios.attendanceConfirmationId,
        ownerId: portfolios.ownerId,
        status: portfolios.status,
        serviceSubtotal: portfolios.serviceSubtotal,
        serviceDiscountPercentage: portfolios.serviceDiscountPercentage,
        serviceDiscountAmount: portfolios.serviceDiscountAmount,
        serviceTotalAfterDiscount: portfolios.serviceTotalAfterDiscount,
        productSubtotal: portfolios.productSubtotal,
        productDiscountPercentage: portfolios.productDiscountPercentage,
        productDiscountAmount: portfolios.productDiscountAmount,
        productTotalAfterDiscount: portfolios.productTotalAfterDiscount,
        totalBeforeDiscount: portfolios.totalBeforeDiscount,
        totalDiscountAmount: portfolios.totalDiscountAmount,
        totalAfterDiscount: portfolios.totalAfterDiscount,
        reviewedAt: portfolios.reviewedAt,
        reviewedBy: portfolios.reviewedBy,
        sentAt: portfolios.sentAt,
        acceptedAt: portfolios.acceptedAt,
        rejectedAt: portfolios.rejectedAt,
        closedAt: portfolios.closedAt,
        createdAt: portfolios.createdAt,
        updatedAt: portfolios.updatedAt,
        clientName: sql<string>`${attendanceConfirmations.firstName} || ' ' || ${attendanceConfirmations.lastName}`,
        clientEmail: attendanceConfirmations.email,
        eventName: salesEvents.name,
        attendanceDate: attendanceConfirmations.attendanceDate,
      })
      .from(portfolios)
      .innerJoin(salesEvents, eq(portfolios.eventId, salesEvents.id))
      .innerJoin(
        attendanceConfirmations,
        eq(portfolios.attendanceConfirmationId, attendanceConfirmations.id),
      )
      .where(eq(portfolios.id, id))
      .limit(1);

    if (!row) return undefined;

    const {
      clientName,
      clientEmail,
      eventName,
      eventId,
      attendanceDate,
      ...portfolio
    } = row;

    return {
      ...portfolio,
      eventId,
      attendanceDate,
      client: { name: clientName, email: clientEmail },
      event: { id: eventId, name: eventName },
    };
  },

  async setStatus(
    id: string,
    input: SetPortfolioStatusInput,
    executor: DbExecutor = db,
  ): Promise<Portfolio | undefined> {
    const [row] = await executor
      .update(portfolios)
      .set({
        status: input.toStatus,
        ...input.timestamps,
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, id))
      .returning();
    return row;
  },
};
