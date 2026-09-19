import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { addTransactionSchema } from '@/lib/validation'
import { db } from '@/server/db'
import {
  accounts,
  TransactionInputMethods,
  TransactionTypeEnum,
  transactions,
} from '@/server/db/schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const transactionRouter = createTRPCRouter({
  getTransactions: protectedProcedure
    .input(
      z.object({
        type: z.enum(TransactionTypeEnum.enumValues).nullish(),
        accountId: z.cuid2().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const data = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            input.type ? eq(transactions.type, input.type) : undefined,
            input.accountId
              ? eq(transactions.accountId, input.accountId)
              : undefined,
          ),
        )
        .orderBy(desc(transactions.date))
      return data
    }),
  deleteTransaction: protectedProcedure
    .input(
      z.object({
        transactionId: z.cuid2(),
        accountId: z.cuid2(),
        amount: z.number().min(1),
        type: z.enum(TransactionTypeEnum.enumValues),
      }),
    )
    .mutation(async ({ ctx: { user }, input }) => {
      await db.transaction(async (tx) => {
        await tx
          .delete(transactions)
          .where(
            and(
              eq(transactions.userId, user.id),
              eq(transactions.id, input.transactionId),
            ),
          )

        const [account] = await tx
          .select({ id: accounts.id, balance: accounts.balance })
          .from(accounts)
          .where(
            and(eq(accounts.userId, user.id), eq(accounts.id, input.accountId)),
          )

        if (!account) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }

        const delta = input.type === 'INCOME' ? -input.amount : input.amount

        await tx
          .update(accounts)
          .set({ balance: account.balance + delta })
          .where(eq(accounts.id, account.id))
      })
    }),
  addTransaction: protectedProcedure
    .input(
      addTransactionSchema.extend({
        inputMethod: z.enum(TransactionInputMethods.enumValues),
        voiceTranscript: z.string().nullish(),
      }),
    )
    .mutation(
      async ({
        ctx: { user },
        input: {
          accountId,
          amount,
          category,
          date,
          type,
          description,
          inputMethod,
          voiceTranscript,
        },
      }) => {
        await db.transaction(async (tx) => {
          await tx.insert(transactions).values({
            accountId,
            amount: Number(amount),
            category,
            type,
            date,
            description,
            inputMethod,
            voiceTranscript,
            userId: user.id,
          })

          const [account] = await tx
            .select({ balance: accounts.balance, id: accounts.id })
            .from(accounts)
            .where(
              and(eq(accounts.userId, user.id), eq(accounts.id, accountId)),
            )

          if (!account) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'No account found',
            })
          }
          if (!account) {
            throw new TRPCError({ code: 'NOT_FOUND' })
          }

          const delta = type === 'INCOME' ? -amount : +amount

          await tx
            .update(accounts)
            .set({ balance: account.balance + delta })
            .where(eq(accounts.id, account.id))
        })
      },
    ),
})
