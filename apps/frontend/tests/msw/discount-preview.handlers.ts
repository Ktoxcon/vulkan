import type {
  DiscountPreview,
  DiscountPreviewCategory,
} from "@/features/portfolios/types/portfolio.types";
import { http, HttpResponse } from "msw";
import { apiUrl } from "./handlers";

export function makeCategory(
  overrides: Partial<DiscountPreviewCategory> = {},
): DiscountPreviewCategory {
  return {
    count: 2,
    subtotal: "700.00",
    discountPercentage: 10,
    discountAmount: "70.00",
    totalAfterDiscount: "630.00",
    ...overrides,
  };
}

export function makePreview(
  overrides: Partial<DiscountPreview> = {},
): DiscountPreview {
  return {
    services: makeCategory(),
    products: makeCategory({
      count: 1,
      subtotal: "500.00",
      discountPercentage: 26,
      discountAmount: "130.00",
      totalAfterDiscount: "370.00",
    }),
    totalBeforeDiscount: "1200.00",
    totalDiscountAmount: "200.00",
    totalAfterDiscount: "1000.00",
    ...overrides,
  };
}

export const discountPreview = (
  preview: DiscountPreview,
  capture?: { body?: Record<string, unknown>; token?: string },
) =>
  http.post(
    apiUrl("/invitations/:token/discount-preview"),
    async ({ request, params }) => {
      if (capture) {
        capture.body = (await request.json()) as Record<string, unknown>;
        capture.token = params.token as string;
      }
      return HttpResponse.json({ success: true, data: preview });
    },
  );

export const discountPreviewError = (
  code = "INVITATION_NOT_FOUND",
  message = "Invitation not found.",
  status = 404,
) =>
  http.post(apiUrl("/invitations/:token/discount-preview"), () =>
    HttpResponse.json({ success: false, code, message }, { status }),
  );
