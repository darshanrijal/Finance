import { db } from "@/server/db";
import { budgets } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const budgetRouter = createTRPCRouter({
  getBudget: protectedProcedure.query(async ({ ctx: { user } }) => {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, user.id));
    return budget;
  }),
});
