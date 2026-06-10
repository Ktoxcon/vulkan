import {
  AssignOfferingBodySchema,
  CreateOfferingBodySchema,
  EventIdParamSchema,
  ListOfferingsQuerySchema,
  OfferingIdParamSchema,
  UpdateOfferingBodySchema,
} from "@vulkan/lib/validators/offering.schemas";
import { describe, expect, it } from "vitest";

const UUID = "11111111-1111-4111-8111-111111111111";

describe("offering validators", () => {
  describe("CreateOfferingBodySchema", () => {
    it("accepts a valid product with numeric basePrice", () => {
      const parsed = CreateOfferingBodySchema.parse({
        type: "product",
        name: "Cloud Migration",
        basePrice: 199.5,
      });
      expect(parsed.type).toBe("product");
      expect(parsed.basePrice).toBe(199.5);
    });

    it("coerces a numeric string basePrice", () => {
      const parsed = CreateOfferingBodySchema.parse({
        type: "service",
        name: "Managed Support",
        basePrice: "49.99",
      });
      expect(parsed.basePrice).toBe(49.99);
    });

    it("defaults basePrice to 0 when omitted", () => {
      const parsed = CreateOfferingBodySchema.parse({
        type: "service",
        name: "Free Consult",
      });
      expect(parsed.basePrice).toBe(0);
    });

    it("trims the name", () => {
      const parsed = CreateOfferingBodySchema.parse({
        type: "product",
        name: "  Padded  ",
      });
      expect(parsed.name).toBe("Padded");
    });

    it("rejects an unknown type", () => {
      expect(() =>
        CreateOfferingBodySchema.parse({ type: "bundle", name: "x" }),
      ).toThrow();
    });

    it("rejects an empty name", () => {
      expect(() =>
        CreateOfferingBodySchema.parse({ type: "product", name: "" }),
      ).toThrow();
    });

    it("rejects a negative basePrice", () => {
      expect(() =>
        CreateOfferingBodySchema.parse({
          type: "product",
          name: "x",
          basePrice: -1,
        }),
      ).toThrow();
    });
  });

  describe("UpdateOfferingBodySchema", () => {
    it("accepts a partial patch", () => {
      const parsed = UpdateOfferingBodySchema.parse({ name: "Renamed" });
      expect(parsed.name).toBe("Renamed");
    });

    it("accepts an empty object (no-op patch)", () => {
      expect(UpdateOfferingBodySchema.parse({})).toEqual({});
    });

    it("does not accept a type field (type is immutable)", () => {
      const parsed = UpdateOfferingBodySchema.parse({
        name: "Renamed",
        type: "service",
      } as Record<string, unknown>);
      expect((parsed as Record<string, unknown>).type).toBeUndefined();
    });

    it("accepts isActive and basePrice", () => {
      const parsed = UpdateOfferingBodySchema.parse({
        isActive: false,
        basePrice: "12.50",
      });
      expect(parsed.isActive).toBe(false);
      expect(parsed.basePrice).toBe(12.5);
    });

    it("rejects an empty name when provided", () => {
      expect(() => UpdateOfferingBodySchema.parse({ name: "" })).toThrow();
    });
  });

  describe("ListOfferingsQuerySchema", () => {
    it("parses string pagination + filters", () => {
      const parsed = ListOfferingsQuerySchema.parse({
        limit: "5",
        offset: "10",
        type: "service",
        isActive: "true",
        search: "cloud",
      });
      expect(parsed.limit).toBe(5);
      expect(parsed.offset).toBe(10);
      expect(parsed.type).toBe("service");
      expect(parsed.isActive).toBe(true);
      expect(parsed.search).toBe("cloud");
    });

    it("coerces isActive=false", () => {
      const parsed = ListOfferingsQuerySchema.parse({ isActive: "false" });
      expect(parsed.isActive).toBe(false);
    });

    it("trims search and rejects an empty one", () => {
      const parsed = ListOfferingsQuerySchema.parse({ search: "  hi  " });
      expect(parsed.search).toBe("hi");
      expect(() => ListOfferingsQuerySchema.parse({ search: "   " })).toThrow();
    });

    it("allows an empty query", () => {
      expect(ListOfferingsQuerySchema.parse({})).toBeTruthy();
    });
  });

  describe("param + assign schemas", () => {
    it("EventIdParamSchema requires a uuid", () => {
      expect(EventIdParamSchema.parse(UUID)).toBe(UUID);
      expect(() => EventIdParamSchema.parse("not-a-uuid")).toThrow();
    });

    it("OfferingIdParamSchema requires a uuid", () => {
      expect(OfferingIdParamSchema.parse(UUID)).toBe(UUID);
      expect(() => OfferingIdParamSchema.parse("123")).toThrow();
    });

    it("AssignOfferingBodySchema requires a uuid offeringId", () => {
      expect(AssignOfferingBodySchema.parse({ offeringId: UUID })).toEqual({
        offeringId: UUID,
      });
      expect(() =>
        AssignOfferingBodySchema.parse({ offeringId: "nope" }),
      ).toThrow();
    });
  });
});
