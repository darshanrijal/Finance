import type { CategoryKey } from "@/constants/categories";
import { TransactionTypeEnum } from "@/server/db/schema";
import { z } from "zod";

export const onboardingSchema = z.object({
  startingBalance: z
    .string()
    .min(1, "Please enter a starting balance.")
    .refine(
      (v) => {
        const parsed = parseFloat(v.replace(/,/g, ""));
        return !Number.isNaN(parsed) && parsed > 0;
      },
      { error: "Please enter a valid starting balance" },
    ),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const addTransactionSchema = z.object({
  type: z.enum(TransactionTypeEnum.enumValues),
  amount: z
    .string()
    .min(1, "Please enter an amount.")
    .refine(
      (v) => {
        const parsed = parseFloat(v.replace(/,/g, ""));
        return !Number.isNaN(parsed) && parsed > 0;
      },
      { error: "Please enter a valid amount" },
    ),
  category: z.custom<CategoryKey>((v) => typeof v === "string"),
  accountId: z.cuid2("Select a valid account"),
  description: z.string().optional(),
  date: z.date(),
});
export type AddTransactionValues = z.infer<typeof addTransactionSchema>;
