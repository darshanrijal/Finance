import { db } from "@/server/db";
import { budgets } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const budgetRouter = createTRPCRouter({
  getBudget: protectedProcedure.query(async ({ ctx: { user } }) => {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, user.id));

    return budget ?? null;
  }),
  upsertBudget: protectedProcedure
    .input(z.object({ amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [budget] = await db
        .insert(budgets)
        .values({ amount: input.amount, userId: ctx.user.id })
        .onConflictDoUpdate({
          target: budgets.userId,
          set: {
            amount: input.amount,
            userId: ctx.user.id,
          },
        })
        .returning();

      if (!budget) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to update budget",
        });
      }

      return budget;
    }),
});
