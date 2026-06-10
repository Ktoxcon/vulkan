import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DiscountSummary } from "@/features/invitation-flow/components/discount-summary.component";
import type { DiscountPreview } from "@/features/portfolios/types/portfolio.types";

function makePreview(overrides: Partial<DiscountPreview> = {}): DiscountPreview {
  return {
    services: {
      count: 2,
      subtotal: "200.00",
      discountPercentage: 10,
      discountAmount: "20.00",
      totalAfterDiscount: "180.00",
    },
    products: {
      count: 3,
      subtotal: "300.00",
      discountPercentage: 5,
      discountAmount: "15.00",
      totalAfterDiscount: "285.00",
    },
    totalBeforeDiscount: "500.00",
    totalDiscountAmount: "35.00",
    totalAfterDiscount: "465.00",
    ...overrides,
  };
}

function getDetailsTrigger() {
  return screen.getByRole("button", { name: /price details/i });
}

describe("DiscountSummary", () => {
  it("always shows the headline total after discount in the header", () => {
    render(<DiscountSummary preview={makePreview()} />);

    expect(screen.getByText("Q465.00")).toBeInTheDocument();
  });

  it("keeps the price details collapsed by default and expands them on click", async () => {
    render(<DiscountSummary preview={makePreview()} />);

    const trigger = getDetailsTrigger();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Q180.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Q500.00")).not.toBeInTheDocument();

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Q180.00")).toBeInTheDocument();
    expect(screen.getByText("Q285.00")).toBeInTheDocument();
    expect(screen.getByText("Q500.00")).toBeInTheDocument();
    expect(screen.getByText("Q35.00")).toBeInTheDocument();
  });

  it("collapses the price details again on a second click", async () => {
    render(<DiscountSummary preview={makePreview()} />);

    const trigger = getDetailsTrigger();
    await userEvent.click(trigger);
    expect(screen.getByText("Q180.00")).toBeInTheDocument();
    expect(screen.getByText("Q500.00")).toBeInTheDocument();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Q180.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Q500.00")).not.toBeInTheDocument();
  });

  it("renders the discount percentages section when a discount exists", () => {
    render(<DiscountSummary preview={makePreview()} />);

    const heading = screen.getByText(/applied discounts/i);
    expect(heading).toBeInTheDocument();

    const section = heading.parentElement as HTMLElement;
    expect(within(section).getByText("10%")).toBeInTheDocument();
    expect(within(section).getByText("5%")).toBeInTheDocument();
  });

  it("renders the percentages section when only one category has a discount", () => {
    render(
      <DiscountSummary
        preview={makePreview({
          services: {
            count: 1,
            subtotal: "100.00",
            discountPercentage: 0,
            discountAmount: "0.00",
            totalAfterDiscount: "100.00",
          },
        })}
      />,
    );

    expect(screen.getByText(/applied discounts/i)).toBeInTheDocument();
  });

  it("hides the percentages section when both categories have zero discount", () => {
    render(
      <DiscountSummary
        preview={makePreview({
          services: {
            count: 1,
            subtotal: "100.00",
            discountPercentage: 0,
            discountAmount: "0.00",
            totalAfterDiscount: "100.00",
          },
          products: {
            count: 1,
            subtotal: "200.00",
            discountPercentage: 0,
            discountAmount: "0.00",
            totalAfterDiscount: "200.00",
          },
        })}
      />,
    );

    expect(screen.queryByText(/applied discounts/i)).not.toBeInTheDocument();
  });

  it("displays values straight from the preview without altering them", async () => {
    const preview = makePreview();
    render(<DiscountSummary preview={preview} />);

    await userEvent.click(getDetailsTrigger());

    expect(screen.getByText("Q200.00")).toBeInTheDocument();
    expect(screen.getByText("Q300.00")).toBeInTheDocument();
    expect(screen.getByText("Q20.00")).toBeInTheDocument();
    expect(screen.getByText("Q15.00")).toBeInTheDocument();
    expect(screen.getByText("Q500.00")).toBeInTheDocument();
    expect(screen.getByText("Q35.00")).toBeInTheDocument();
    expect(screen.getAllByText("Q465.00").length).toBeGreaterThan(0);
  });

  it("toggles aria-expanded when the trigger is operated via the keyboard", async () => {
    render(<DiscountSummary preview={makePreview()} />);

    const trigger = getDetailsTrigger();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    trigger.focus();
    expect(trigger).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("links the trigger to its content via aria-controls once expanded", async () => {
    render(<DiscountSummary preview={makePreview()} />);

    const trigger = getDetailsTrigger();
    await userEvent.click(trigger);
    const controls = trigger.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls as string)).toBeInTheDocument();
  });
});
