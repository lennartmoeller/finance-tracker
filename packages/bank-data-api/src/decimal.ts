import { z } from "zod";

export const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);
