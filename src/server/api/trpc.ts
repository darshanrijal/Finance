import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError, z } from 'zod'
import { auth } from '../auth'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const sessionData = await auth.api.getSession({ headers: opts.headers })
  return {
    headers: opts.headers,
    sessionData,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? z.treeifyError(error.cause) : null,
      },
    }
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.sessionData?.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.sessionData.session,
      user: ctx.sessionData.user,
    },
  })
})
