import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { inferRouterOutputs } from '@trpc/server'
import React, { useState } from 'react'
import { SuperJSON } from 'superjson'
import { env } from '@/config/env'
import { authClient } from '@/lib/auth-client'
import type { AppRouter } from '@/server/api/root'

export const trpc = createTRPCReact<AppRouter>()

export type RouterOutputs = inferRouterOutputs<AppRouter>

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      }),
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: SuperJSON,
          url: `${env.EXPO_PUBLIC_SERVER_URL}/api/trpc`,
          async headers() {
            const headers = new Map<string, string>()
            headers.set('x-trpc-source', 'expo-react-native')
            const cookies = await authClient.getCookie()
            if (cookies) {
              headers.set('Cookie', cookies)
            }
            return Object.fromEntries(headers)
          },
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  )
}
