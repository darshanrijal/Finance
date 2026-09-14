import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  server: {
    DATABASE_URL: z.string().startsWith("postgresql"),
    BETTER_AUTH_SECRET: z.string().length(32),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GEMINI_API_KEY: z.string(),
  },
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
});
