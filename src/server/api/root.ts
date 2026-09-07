import { budgetRouter } from "./routers/budget-router";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    status: "OK",
    timestamp: new Date(),
  })),
  budget: budgetRouter,
});

export type AppRouter = typeof appRouter;
