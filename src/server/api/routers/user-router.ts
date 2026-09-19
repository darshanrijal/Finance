import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { AllCurrencies } from '@/components/CurrencyPicker'
import { db } from '@/server/db'
import { user as userSchema } from '@/server/db/schema'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const userRouter = createTRPCRouter({
  updateCurrency: protectedProcedure
    .input(
      z.object({
        currency: z.custom<string>((value) =>
          AllCurrencies.some((curr) => curr.code === value),
        ),
      }),
    )
    .mutation(async ({ input, ctx: { user } }) => {
      const [userData] = await db
        .update(userSchema)
        .set({ currency: input.currency })
        .where(eq(userSchema.id, user.id))
        .returning()

      if (!userData) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update currency',
        })
      }

      return { currency: userData.currency }
    }),
})
