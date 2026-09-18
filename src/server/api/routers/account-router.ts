import { createAccountSchema, updateAccountSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { accounts, transactions } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
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
  createAccount: protectedProcedure
    .input(createAccountSchema)
    .mutation(async ({ ctx: { user }, input }) => {
      const [account] = await db
        .insert(accounts)
        .values({
          userId: user.id,
          name: input.name,
          type: input.type,
          isDefault: false,
          balance: 0,
        })
        .returning();

      if (!account) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account",
        });
      }

      return account;
    }),

  setDefaultAccount: protectedProcedure
    .input(z.object({ accountId: z.cuid2() }))
    .mutation(async ({ ctx: { user }, input }) => {
      await db.transaction(async (tx) => [
        tx
          .update(accounts)
          .set({ isDefault: false })
          .where(
            and(eq(accounts.userId, user.id), eq(accounts.isDefault, true)),
          ),
        tx
          .update(accounts)
          .set({ isDefault: true })
          .where(
            and(
              eq(accounts.userId, user.id),
              eq(accounts.isDefault, false),
              eq(accounts.id, input.accountId),
            ),
          ),
      ]);
    }),

  updateAccount: protectedProcedure
    .input(updateAccountSchema.extend({ accountId: z.cuid2() }))
    .mutation(async ({ ctx: { user }, input }) => {
      const [account] = await db
        .update(accounts)
        .set({ name: input.name, type: input.type })
        .where(
          and(eq(accounts.userId, user.id), eq(accounts.id, input.accountId)),
        )
        .returning();
      if (!account) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create account",
        });
      }

      return account;
    }),

  deleteAccount: protectedProcedure
    .input(
      z.object({ accountId: z.cuid2(), force: z.boolean().default(false) }),
    )
    .mutation(async ({ ctx: { user }, input }) => {
      const data = await db.transaction(async (tx) => {
        const [transaction] = await tx
          .select({ count: count().mapWith(Number) })
          .from(transactions)
          .where(
            and(
              eq(transactions.accountId, input.accountId),
              eq(transactions.userId, user.id),
            ),
          );

        if (!transaction) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No account found",
          });
        }

        const txCount = transaction.count;

        if (txCount > 0 && !input.force) {
          return { deleted: false, transactionCount: txCount };
        }

        await db
          .delete(accounts)
          .where(
            and(eq(accounts.id, input.accountId), eq(accounts.userId, user.id)),
          );
        return { deleted: true, transactionCount: txCount };
      });

      return data;
    }),
});
