import { useQuery } from '@tanstack/react-query'
import { trpc } from '@/__rpc/react'
import { authClient } from '@/lib/auth-client'

export const useUserStore = () => {
  const { data, refetch } = authClient.useSession()

  const user = data?.user
  const CURRENCY_QUERY_KEY = 'userCurrency'

  const currencyQuery = useQuery({
    queryKey: [CURRENCY_QUERY_KEY],
    initialData: { currency: user?.currency ?? 'NPR' },
    queryFn: () => {
      return { currency: user?.currency ?? 'NPR' }
    },
    enabled: !!user?.id,
  })

  const updateCurrency = trpc.user.updateCurrency.useMutation({
    onMutate: async (newCurrency, ctx) => {
      await ctx.client.cancelQueries(currencyQuery)
      const prevCurrency = ctx.client.getQueryData([
        CURRENCY_QUERY_KEY,
      ]) as string

      ctx.client.setQueryData<string>(
        [CURRENCY_QUERY_KEY],
        newCurrency.currency,
      )

      return { prevCurrency }
    },

    onError: (_, __, onMutateResult, ctx) => {
      ctx.client.setQueryData<string>(
        [CURRENCY_QUERY_KEY],
        onMutateResult?.prevCurrency,
      )
    },
    onSettled: async (_, __, ___, ____, ctx) => {
      await refetch()
      ctx.client.invalidateQueries(currencyQuery)
    },
  })

  const currency = currencyQuery.data.currency
  const setCurrency = updateCurrency.mutate

  return { currency, setCurrency }
}
