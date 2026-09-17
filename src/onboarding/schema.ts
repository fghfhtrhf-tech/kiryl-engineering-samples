import { z } from "zod";

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("375") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("80") && digits.length === 11) return `+375${digits.slice(2)}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

const personal = {
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(8).max(20),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
};

function refineAdult(data: { birthDate: string; phone: string }, ctx: z.RefinementCtx) {
  const birth = new Date(`${data.birthDate}T00:00:00Z`);
  const adult = new Date(birth);
  adult.setUTCFullYear(adult.getUTCFullYear() + 18);
  if (adult > new Date()) {
    ctx.addIssue({ code: "custom", path: ["birthDate"], message: "Must be 18+" });
  }
  const phone = normalizePhone(data.phone);
  if (!/^\+\d{10,15}$/.test(phone)) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: "E.164 phone required" });
  }
}

const walking = z.object({
  track: z.literal("walking"),
  ...personal
});

const vehicle = z.object({
  track: z.literal("vehicle"),
  ...personal,
  plate: z
    .string()
    .trim()
    .min(4)
    .max(12)
    .transform((value) => value.toUpperCase().replace(/\s+/g, "")),
  vin: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => !value || /^[A-HJ-NPR-Z0-9]{17}$/i.test(value), "VIN must be 17 chars"),
  year: z.coerce.number().int().min(1990).max(new Date().getFullYear())
});

export const registrationSchema = z
  .discriminatedUnion("track", [walking, vehicle])
  .superRefine(refineAdult);
export type RegistrationInput = z.infer<typeof registrationSchema>;
