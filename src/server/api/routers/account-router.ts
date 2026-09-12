import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const accountRouter = createTRPCRouter({
  getAccounts: protectedProcedure.query(async ({ ctx: { user } }) => {
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, user.id))
      .orderBy(desc(accounts.createdAt), asc(accounts.createdAt));
    return userAccounts;
  }),
});
