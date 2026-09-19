import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { onboardingSchema } from '@/lib/validation'
import { db } from '@/server/db'
import { accounts, transactions, user } from '@/server/db/schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const onboardingRouter = createTRPCRouter({
  complete: protectedProcedure
    .input(
      onboardingSchema.extend({
        selectedCurrency: z.string().length(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { selectedCurrency, startingBalance } = input

      const balance = Number(startingBalance)

      if (!Number.isFinite(balance) || balance < 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid starting balance',
        })
      }

      await db.transaction(async (tx) => {
        if (!ctx.user.isRequiredOnboarding) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Onboarding has already been completed',
          })
        }

        const [account] = await tx
          .insert(accounts)
          .values({
            userId: ctx.user.id,
            name: 'Cash',
            type: 'CASH',
            balance,
            isDefault: true,
          })
          .returning({
            id: accounts.id,
          })

        if (!account) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: "Couldn't create default account",
          })
        }

        await tx.insert(transactions).values({
          userId: ctx.user.id,
          accountId: account.id,
          type: 'INCOME',
          amount: balance,
          category: 'other_income',
          description: 'Starting balance',
          date: new Date(),
          inputMethod: 'MANUAL',
        })

        await tx
          .update(user)
          .set({
            currency: selectedCurrency,
            isRequiredOnboarding: false,
          })
          .where(eq(user.id, ctx.user.id))
      })

      return {
        success: true,
      }
    }),
})
