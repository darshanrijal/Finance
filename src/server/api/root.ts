import { createTRPCRouter, publicProcedure } from "./trpc";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    status: "OK",
    timestamp: new Date(),
  })),
});

export type AppRouter = typeof appRouter;
