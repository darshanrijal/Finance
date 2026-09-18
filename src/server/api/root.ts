import { accountRouter } from "./routers/account-router";
import { aiRouter } from "./routers/ai-router";
import { budgetRouter } from "./routers/budget-router";
import { onboardingRouter } from "./routers/onboarding-router";
import { transactionRouter } from "./routers/transaction-router";
import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    status: "OK",
    timestamp: new Date(),
  })),
  budget: budgetRouter,
  onboarding: onboardingRouter,
  accounts: accountRouter,
  transactions: transactionRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
