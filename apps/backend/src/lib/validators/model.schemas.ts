import { z } from "zod";

export const IdParamSchema = z.string().nonempty();

export const StatusSchema = z
  .string()
  .nonempty()
  .transform((statusString) => {
    const status = statusString === "true" ? true : false;
    return status;
  });

export const PriceSchema = z
  .string()
  .transform((priceString) => Number(priceString));

export const QuantitySchema = z
  .string()
  .nonempty()
  .transform((quantityString) => Number(quantityString));
