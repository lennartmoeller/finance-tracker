import { z } from "zod";

export const bank = z.enum([
  "Deutsche Bank",
  "finvesto",
  "ING",
  "Trade Republic",
]);
