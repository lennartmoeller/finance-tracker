import { z } from "zod";

export const currencyPattern = /^[A-Z]{3}$/;

export const currency = z.string().regex(currencyPattern);
