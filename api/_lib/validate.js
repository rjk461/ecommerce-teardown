import { z } from "zod";

export const testTeardownSchema = z.object({
  url: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  notes: z.string().max(2000).optional().or(z.literal("")).transform((v) => (v ? v : undefined))
});

export function normalizeUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}


