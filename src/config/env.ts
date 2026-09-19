import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'EXPO_PUBLIC_',
  server: {
    DATABASE_URL: z.string().startsWith('postgresql'),
    BETTER_AUTH_SECRET: z.string().length(32),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GEMINI_API_KEY: z.string(),
  },
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url().default("https://darshanrijal0-finance.expo.app"),
  },
  emptyStringAsUndefined: true,
  runtimeEnvStrict:{
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
  },
  skipValidation:
    typeof window !== 'undefined' || process.env.NODE_ENV === 'production',
})
