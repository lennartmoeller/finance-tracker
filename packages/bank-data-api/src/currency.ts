import { z } from "zod";

export const currency = z.string().regex(/^[A-Z]{3}$/);
