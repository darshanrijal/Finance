import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  server: {},
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
});
