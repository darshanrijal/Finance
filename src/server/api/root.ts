import { budgetRouter } from "./routers/budget-router";
import { onboardingRouter } from "./routers/onboarding-router";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    status: "OK",
    timestamp: new Date(),
  })),
  budget: budgetRouter,
  onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
