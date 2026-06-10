import {
  CreateSalesEventRequestBodySchema,
  UpdateSalesEventRequestBodySchema,
} from "@vulkan/lib/validators/sales-event.schemas";
import { describe, expect, it } from "vitest";

const validCreate = {
  name: "Annual Promo 2026",
  description: "Yearly event",
  capacity: 30,
  reservationTimeoutMinutes: 15,
  requireConfirmation: true,
  eventStartDate: "2026-08-30T00:00:00.000Z",
  registrationStartDate: "2026-08-01T00:00:00.000Z",
  registrationEndDate: "2026-08-15T00:00:00.000Z",
};

describe("sales-event validators", () => {
  describe("CreateSalesEventRequestBodySchema", () => {
    it("accepts a fully valid payload and coerces dates/numbers", () => {
      const parsed = CreateSalesEventRequestBodySchema.parse(validCreate);
      expect(parsed.name).toBe("Annual Promo 2026");
      expect(parsed.capacity).toBe(30);
      expect(parsed.eventStartDate).toBeInstanceOf(Date);
      expect(parsed.registrationStartDate).toBeInstanceOf(Date);
      expect(parsed.requireConfirmation).toBe(true);
    });

    it("accepts coercible string capacity", () => {
      const parsed = CreateSalesEventRequestBodySchema.parse({
        ...validCreate,
        capacity: "30",
      });
      expect(parsed.capacity).toBe(30);
    });

    it("rejects an empty name", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({ ...validCreate, name: "" }),
      ).toThrow();
    });

    it("rejects a missing name", () => {
      const { name, ...rest } = validCreate;
      void name;
      expect(() => CreateSalesEventRequestBodySchema.parse(rest)).toThrow();
    });

    it("rejects non-positive capacity", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({ ...validCreate, capacity: 0 }),
      ).toThrow();
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          capacity: -5,
        }),
      ).toThrow();
    });

    it("rejects non-integer capacity", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          capacity: 2.5,
        }),
      ).toThrow();
    });

    it("rejects negative reservationTimeoutMinutes", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          reservationTimeoutMinutes: -1,
        }),
      ).toThrow();
    });

    it("rejects registrationStartDate >= registrationEndDate", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          registrationStartDate: "2026-08-15T00:00:00.000Z",
          registrationEndDate: "2026-08-01T00:00:00.000Z",
        }),
      ).toThrow();
    });

    it("rejects registrationEndDate after eventStartDate", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          registrationEndDate: "2026-09-15T00:00:00.000Z",
        }),
      ).toThrow();
    });

    it("allows registrationEndDate equal to eventStartDate", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          registrationEndDate: "2026-08-30T00:00:00.000Z",
        }),
      ).not.toThrow();
    });

    it("rejects eventEndDate before eventStartDate", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          eventEndDate: "2026-08-29T00:00:00.000Z",
        }),
      ).toThrow();
    });

    it("rejects ownerId in the body (strict)", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          ownerId: "11111111-1111-1111-1111-111111111111",
        }),
      ).toThrow();
    });

    it("rejects status in the create body (strict)", () => {
      expect(() =>
        CreateSalesEventRequestBodySchema.parse({
          ...validCreate,
          status: "active",
        }),
      ).toThrow();
    });
  });

  describe("UpdateSalesEventRequestBodySchema", () => {
    it("accepts a single-field patch", () => {
      const parsed = UpdateSalesEventRequestBodySchema.parse({
        name: "Renamed",
      });
      expect(parsed.name).toBe("Renamed");
    });

    it("accepts a status-only patch (lifecycle transition)", () => {
      const parsed = UpdateSalesEventRequestBodySchema.parse({
        status: "active",
      });
      expect(parsed.status).toBe("active");
    });

    it("rejects an unknown status value", () => {
      expect(() =>
        UpdateSalesEventRequestBodySchema.parse({ status: "archived" }),
      ).toThrow();
    });

    it("rejects an empty patch", () => {
      expect(() => UpdateSalesEventRequestBodySchema.parse({})).toThrow();
    });

    it("rejects ownerId in a patch (strict)", () => {
      expect(() =>
        UpdateSalesEventRequestBodySchema.parse({ ownerId: "x" }),
      ).toThrow();
    });

    it("enforces date ordering when both endpoints are supplied", () => {
      expect(() =>
        UpdateSalesEventRequestBodySchema.parse({
          registrationStartDate: "2026-08-15T00:00:00.000Z",
          registrationEndDate: "2026-08-01T00:00:00.000Z",
        }),
      ).toThrow();
    });

    it("does not enforce ordering when only one date is supplied", () => {
      expect(() =>
        UpdateSalesEventRequestBodySchema.parse({
          registrationEndDate: "2026-08-01T00:00:00.000Z",
        }),
      ).not.toThrow();
    });
  });
});
