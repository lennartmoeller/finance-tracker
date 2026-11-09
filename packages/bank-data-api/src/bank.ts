import { z } from "zod";

export const bank = z.enum(["ING", "Trade Republic", "Deutsche Bank"]);
