import {
  PortfolioItemColumns,
  PortfolioTotalsLabel,
} from "@vulkan/lib/services/portfolio-export.service.constants";
import { PortfolioService } from "@vulkan/lib/services/portfolio.service";

export const PortfolioExportService = {
  async toCsv(portfolioId: string): Promise<string> {
    const detail = await PortfolioService.getDetail(portfolioId);

    const meta = [
      ["Client", detail.client.name],
      ["Email", detail.client.email],
      ["Event", detail.event.name],
      ["Attendance Date", detail.attendanceDate.toISOString().slice(0, 10)],
      ["Status", detail.status],
    ].map((row) =>
      row.map((value) => PortfolioExportService.escapeCsv(value)).join(","),
    );

    const header = PortfolioItemColumns.map((column) =>
      PortfolioExportService.escapeCsv(column),
    ).join(",");

    const itemRows = detail.items.map((item) =>
      [
        item.offeringName,
        item.offeringType,
        item.basePrice,
        String(item.discountPercentage),
        item.discountAmount,
        item.finalPrice,
      ]
        .map((value) => PortfolioExportService.escapeCsv(value))
        .join(","),
    );

    const totalsRow = [
      PortfolioTotalsLabel,
      "",
      detail.totalBeforeDiscount,
      "",
      detail.totalDiscountAmount,
      detail.totalAfterDiscount,
    ]
      .map((value) => PortfolioExportService.escapeCsv(value))
      .join(",");

    return [...meta, "", header, ...itemRows, totalsRow].join("\n");
  },

  escapeCsv(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  },
};
