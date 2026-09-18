import { env } from "@/config/env";
import {
  CATEGORY_KEYS_EXPENSE,
  CATEGORY_KEYS_INCOME,
} from "@/constants/categories";
import { TransactionTypeEnum } from "@/server/db/schema";
import { createGoogle } from "@ai-sdk/google";
import { z } from "zod";

export const google = createGoogle({
  apiKey: env.GEMINI_API_KEY,
});

const expenseCategories = z.enum(CATEGORY_KEYS_EXPENSE);

const allCategories = z.enum([
  ...CATEGORY_KEYS_EXPENSE,
  ...CATEGORY_KEYS_INCOME,
]);

export const receiptInputSchema = z.object({
  base64Image: z.string().min(1, "Image data is required"),
  mimeType: z.string().startsWith("image/", "Invalid image MIME type"),
});

export const voiceInputSchema = z.object({
  base64Audio: z.string().min(1, "Audio data is required"),
  mimeType: z.string().startsWith("audio/", "Invalid audio MIME type"),
});

export const receiptOutputSchema = z.object({
  type: z.enum(TransactionTypeEnum.enumValues),

  amount: z.number().nullable(),

  category: expenseCategories.nullable(),

  description: z.string().nullable(),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .nullable(),

  transcript: z.null(),
});

export const voiceOutputSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME"]).nullable(),

  amount: z.number().nullable(),

  category: allCategories.nullable(),

  description: z.string().nullable(),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .nullable(),

  transcript: z.string().nullable(),
});

export type ReceiptTransaction = z.infer<typeof receiptOutputSchema>;

export type VoiceTransaction = z.infer<typeof voiceOutputSchema>;
