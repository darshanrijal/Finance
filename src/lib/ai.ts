import { env } from "@/config/env";
import {
  CATEGORY_KEYS_EXPENSE,
  CATEGORY_KEYS_INCOME,
} from "@/constants/categories";
import { createGoogle } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

const google = createGoogle({
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
  type: z.literal("EXPENSE"),

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

// Receipt
export async function extractTransactionFromReceipt(
  input: unknown,
): Promise<ReceiptTransaction> {
  const { base64Image, mimeType } = receiptInputSchema.parse(input);

  const { output } = await generateText({
    model: google("gemini-3.1-flash-lite"),

    output: Output.object({
      schema: receiptOutputSchema,
    }),

    system: `You extract transaction information from receipt images for a personal finance application.

Rules:
- type is always "EXPENSE".
- amount is the final total actually paid.
- amount must be a plain number without currency symbols.
- category must be exactly one of the provided expense categories.
- description should be a short label, preferably the merchant or store name.
- date must be in YYYY-MM-DD format if the receipt date is visible.
- transcript must always be null.
- If a field cannot be determined confidently, return null.
- Never guess or invent information.

Available expense categories:
${CATEGORY_KEYS_EXPENSE.join(", ")}`,

    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the transaction details from this receipt.",
          },
          {
            type: "image",
            image: `data:${mimeType};base64,${base64Image}`,
          },
        ],
      },
    ],
  });

  return output;
}

// Voice
export async function extractTransactionFromVoice(
  input: unknown,
): Promise<VoiceTransaction> {
  const { base64Audio, mimeType } = voiceInputSchema.parse(input);

  const today = new Date().toISOString().slice(0, 10);

  const { output } = await generateText({
    model: google("gemini-3.1-flash-lite"),

    output: Output.object({
      schema: voiceOutputSchema,
    }),

    system: `You extract transaction information from a short voice note for a personal finance application.

Today's date is ${today}.

Rules:
- type must be "EXPENSE" or "INCOME" based on what the user said.
- amount is the amount mentioned by the user as a plain number.
- category must be one of the provided categories.
- If type is EXPENSE, category must come from the expense category list.
- If type is INCOME, category must come from the income category list.
- description is a short label summarizing what the transaction was for.
- date should be null unless the user clearly mentioned a date or relative date.
- Resolve relative dates such as "today", "yesterday", and weekdays using today's date.
- date must be in YYYY-MM-DD format.
- transcript must contain the transcription of what was said.
- If a field cannot be determined confidently, return null.
- Never guess or invent information.

Expense categories:
${CATEGORY_KEYS_EXPENSE.join(", ")}

Income categories:
${CATEGORY_KEYS_INCOME.join(", ")}`,

    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe the audio and extract the transaction details.",
          },
          {
            type: "file",
            data: `data:${mimeType};base64,${base64Audio}`,
            mediaType: mimeType,
          },
        ],
      },
    ],
  });

  return output;
}
