import {
  CATEGORY_KEYS_EXPENSE,
  CATEGORY_KEYS_INCOME,
} from "@/constants/categories";
import {
  google,
  receiptInputSchema,
  receiptOutputSchema,
  voiceInputSchema,
  voiceOutputSchema,
} from "@/lib/ai";
import { generateText, Output } from "ai";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const aiRouter = createTRPCRouter({
  extractTransactionFromReceipt: protectedProcedure
    .input(receiptInputSchema)
    .mutation(async ({ input }) => {
      const { base64Image, mimeType } = input;

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
    }),
  extractTransactionFromVoice: protectedProcedure
    .input(voiceInputSchema)
    .mutation(async ({ input }) => {
      const { base64Audio, mimeType } = input;

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
    }),
});
