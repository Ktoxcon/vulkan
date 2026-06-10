import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterestedOfferingsList } from "@/features/invitation-flow/components/interested-offerings-list.component";
import { INTERESTED_OFFERINGS_MAX_HEIGHT } from "@/features/invitation-flow/constants/invitation-flow.constants";
import type { ClientOfferingWithType } from "@/features/invitation-flow/types/invitation-flow.types";
import { installRadixJsdomShims } from "../../../helpers/radix";

installRadixJsdomShims();

function makeOffering(
  overrides: Partial<ClientOfferingWithType> & { id: string; name: string },
): ClientOfferingWithType {
  return {
    description: null,
    basePrice: "100",
    type: "product",
    ...overrides,
  };
}

function makeOfferings(count: number): ClientOfferingWithType[] {
  return Array.from({ length: count }, (_, index) =>
    makeOffering({
      id: `o-${index}`,
      name: `Offering ${index}`,
      type: index % 2 === 0 ? "product" : "service",
    }),
  );
}

const mixed: ClientOfferingWithType[] = [
  makeOffering({ id: "p-1", name: "Drakescale Plate", type: "product" }),
  makeOffering({ id: "s-1", name: "Armor Fitting", type: "service" }),
];

function renderList(
  offerings: ClientOfferingWithType[],
  selectedIds: string[] = [],
) {
  const onToggle = vi.fn();
  const utils = render(
    <InterestedOfferingsList
      offerings={offerings}
      selectedIds={selectedIds}
      onToggle={onToggle}
    />,
  );
  return { onToggle, ...utils };
}

function scrollContainer(): HTMLElement | null {
  return document.querySelector('[data-slot="scroll-area-viewport"]');
}

describe("InterestedOfferingsList", () => {
  describe("unified list", () => {
    it("renders products and services together in one list", () => {
      renderList(mixed);

      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(screen.getByText("Drakescale Plate")).toBeInTheDocument();
      expect(screen.getByText("Armor Fitting")).toBeInTheDocument();
    });

    it("shows the correct text badge per row by type", () => {
      renderList(mixed);

      const productRow = screen
        .getByText("Drakescale Plate")
        .closest("li") as HTMLElement;
      const serviceRow = screen
        .getByText("Armor Fitting")
        .closest("li") as HTMLElement;

      expect(within(productRow).getByText("Product")).toBeInTheDocument();
      expect(within(serviceRow).getByText("Service")).toBeInTheDocument();
    });

    it("renders the price for each row", () => {
      renderList([makeOffering({ id: "p-1", name: "Plate", basePrice: "250" })]);

      expect(screen.getByText("Q250.00")).toBeInTheDocument();
    });

    it("does not crash on an unexpected type and falls back to a label", () => {
      renderList([
        {
          id: "x-1",
          name: "Mystery",
          description: null,
          basePrice: "10",
          type: "bundle" as unknown as ClientOfferingWithType["type"],
        },
      ]);

      const row = screen.getByText("Mystery").closest("li") as HTMLElement;
      expect(within(row).getByText("bundle")).toBeInTheDocument();
      expect(screen.queryByText("Product")).not.toBeInTheDocument();
      expect(screen.queryByText("Service")).not.toBeInTheDocument();
    });

    it("toggles an offering, passing the full offering", async () => {
      const user = userEvent.setup();
      const { onToggle } = renderList(mixed);

      await user.click(screen.getByText("Drakescale Plate"));

      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith(mixed[0]);
    });

    it("reflects selection via checked checkboxes", () => {
      renderList(mixed, ["p-1"]);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  describe("empty state", () => {
    it("shows the empty message and no search when there are no offerings", () => {
      renderList([]);

      const empty = document.querySelector('[data-slot="offerings-empty"]');
      expect(empty).toBeInTheDocument();
      expect(empty).toHaveTextContent("No offerings are available for this event.");
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
  });

  describe("scroll cap", () => {
    it("renders exactly four rows inside the capped container with no extra rows", () => {
      renderList(makeOfferings(4));

      expect(screen.getAllByRole("listitem")).toHaveLength(4);
      const container = scrollContainer();
      expect(container).toBeInTheDocument();
      expect(container?.className).toContain(INTERESTED_OFFERINGS_MAX_HEIGHT);
    });

    it("keeps the capped container while rendering more than four rows", () => {
      renderList(makeOfferings(7));

      expect(screen.getAllByRole("listitem")).toHaveLength(7);
      const container = scrollContainer();
      expect(container).toBeInTheDocument();
      expect(container?.className).toContain(INTERESTED_OFFERINGS_MAX_HEIGHT);
    });

    it("applies overscroll containment to the scrolling list", () => {
      renderList(makeOfferings(7));

      const viewport = scrollContainer();
      expect(viewport?.className).toContain("overscroll-contain");
    });
  });

  describe("search", () => {
    const catalog: ClientOfferingWithType[] = [
      makeOffering({ id: "a", name: "Drakescale Plate", type: "product" }),
      makeOffering({ id: "b", name: "Armor Fitting", type: "service" }),
      makeOffering({ id: "c", name: "Plate Polish", type: "service" }),
    ];

    it("filters by exact name", async () => {
      const user = userEvent.setup();
      renderList(catalog);

      await user.type(screen.getByRole("searchbox"), "Armor Fitting");

      expect(screen.getByText("Armor Fitting")).toBeInTheDocument();
      expect(screen.queryByText("Drakescale Plate")).not.toBeInTheDocument();
      expect(screen.queryByText("Plate Polish")).not.toBeInTheDocument();
    });

    it("filters by partial name", async () => {
      const user = userEvent.setup();
      renderList(catalog);

      await user.type(screen.getByRole("searchbox"), "Plate");

      expect(screen.getByText("Drakescale Plate")).toBeInTheDocument();
      expect(screen.getByText("Plate Polish")).toBeInTheDocument();
      expect(screen.queryByText("Armor Fitting")).not.toBeInTheDocument();
    });

    it("filters case-insensitively", async () => {
      const user = userEvent.setup();
      renderList(catalog);

      await user.type(screen.getByRole("searchbox"), "armor");

      expect(screen.getByText("Armor Fitting")).toBeInTheDocument();
      expect(screen.queryByText("Drakescale Plate")).not.toBeInTheDocument();
    });

    it("trims surrounding whitespace before matching", async () => {
      const user = userEvent.setup();
      renderList(catalog);

      await user.type(screen.getByRole("searchbox"), "   armor   ");

      expect(screen.getByText("Armor Fitting")).toBeInTheDocument();
      expect(screen.queryByText("Drakescale Plate")).not.toBeInTheDocument();
    });

    it("restores the full list when the query is cleared", async () => {
      const user = userEvent.setup();
      renderList(catalog);

      const search = screen.getByRole("searchbox");
      await user.type(search, "armor");
      expect(screen.getAllByRole("listitem")).toHaveLength(1);

      await user.clear(search);
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("shows a no-results message distinct from the empty state", async () => {
      const user = userEvent.setup();
      renderList(catalog);

      await user.type(screen.getByRole("searchbox"), "zzz");

      const noResults = document.querySelector(
        '[data-slot="offerings-no-results"]',
      );
      expect(noResults).toBeInTheDocument();
      expect(noResults).toHaveTextContent("No offerings match your search.");
      expect(
        document.querySelector('[data-slot="offerings-empty"]'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("caps filtered results in the scroll container too", async () => {
      const user = userEvent.setup();
      renderList([
        ...makeOfferings(6).map((o) => ({ ...o, name: `Match ${o.id}` })),
        makeOffering({ id: "other", name: "Unrelated" }),
      ]);

      await user.type(screen.getByRole("searchbox"), "Match");

      expect(screen.getAllByRole("listitem")).toHaveLength(6);
      const container = scrollContainer();
      expect(container?.className).toContain(INTERESTED_OFFERINGS_MAX_HEIGHT);
    });
  });
});
