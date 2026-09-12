import { db } from "@/server/db";
import { transactions, TransactionTypeEnum } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const transactionRouter = createTRPCRouter({
  getTransactions: protectedProcedure
    .input(
      z.object({
        type: z.enum(TransactionTypeEnum.enumValues).optional(),
        accountId: z.cuid2().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            input.type && eq(transactions.type, input.type),
            input.accountId
              ? eq(transactions.accountId, input.accountId)
              : undefined,
          ),
        )
        .orderBy(desc(transactions.date));
      return data;
    }),
});
