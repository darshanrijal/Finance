import Feather from '@expo/vector-icons/Feather'
import {
  eachDayOfInterval,
  formatDate,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { useUniwind } from 'uniwind'
import { trpc } from '@/__rpc/react'
import { SafeAreaView } from '@/components/SafeAreaView'
import { TransactionRow } from '@/components/TransactionRow'
import type { Transaction } from '@/constants/transaction'
import { useDeleteTransaction } from '@/hooks/useTransactionMutations'
import { cn, exportTransactionsToCsv } from '@/lib/utils'
import { TransactionTypeEnum } from '@/server/db/schema'

const filters = ['All', ...TransactionTypeEnum.enumValues] as const

function dayKey(date: Date) {
  return formatDate(date, 'yyyy-MM-dd')
}

function currentMonthDays() {
  const today = startOfDay(new Date())

  return eachDayOfInterval({
    start: startOfMonth(today),
    end: today,
  }).map((date) => ({
    key: dayKey(date),
    label: formatDate(date, 'd MMM'),
  }))
}

export default function Transactions() {
  const [activeFilters, setActiveFilters] =
    useState<(typeof filters)[number]>('All')
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  const typeFilter = activeFilters === 'All' ? null : activeFilters

  const {
    data: transactions = [],
    isPending: isTransactionsLoading,
    isRefetching: isTransactionsRefetching,
    error: transactionsError,
    refetch: refetchTransactions,
  } = trpc.transactions.getTransactions.useQuery({
    type: typeFilter,
    accountId: activeAccountId,
  })

  const { data: accounts = [], refetch: refetchAccounts } =
    trpc.accounts.getAccounts.useQuery()

  const { mutateAsync: removeTransaction } = useDeleteTransaction()

  const isDark = useUniwind().theme === 'dark'

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return transactions
    }

    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query),
    )
  }, [search, transactions])

  const dailyIncomeExpense = useMemo(() => {
    const days = currentMonthDays()

    const totals = new Map<
      string,
      {
        income: number
        expense: number
      }
    >()

    for (const tx of transactions) {
      const key = dayKey(tx.date)
      const current = totals.get(key) ?? {
        income: 0,
        expense: 0,
      }

      if (tx.type === 'INCOME') {
        current.income += tx.amount
      } else if (tx.type === 'EXPENSE') {
        current.expense += tx.amount
      }

      totals.set(key, current)
    }

    return days.flatMap(({ key, label }) => {
      const totalsForDay = totals.get(key)

      return [
        {
          value: totalsForDay?.income ?? 0,
          label,
          frontColor: '#22c55e',
        },
        {
          value: totalsForDay?.expense ?? 0,
          label,
          frontColor: '#ef4444',
        },
      ]
    })
  }, [transactions])

  const handleExport = async () => {
    if (exporting) {
      return
    }

    setExporting(true)

    try {
      const { count } = await exportTransactionsToCsv(transactions)

      if (count === 0) {
        Alert.alert('Nothing to export', 'No transactions in the export window')
        return
      }
    } catch (error) {
      console.error(error)
      Alert.alert('Error', "Couldn't export transactions.")
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Delete transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeTransaction({
              accountId: tx.accountId,
              amount: tx.amount,
              transactionId: tx.id,
              type: tx.type,
            })
          },
        },
      ],
    )
  }

  const refetchData = async () => {
    await Promise.all([refetchAccounts(), refetchTransactions()])
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-5 pt-3 pb-3">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="font-brand-semibold text-foreground text-xl">
              Transactions
            </Text>

            {transactions.length > 0 && (
              <Text className="mt-0.5 font-brand text-muted-foreground text-xs">
                {transactions.length}{' '}
                {transactions.length === 1 ? 'transaction' : 'transactions'}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.8}
            className="size-10 items-center justify-center rounded-full border border-border bg-card"
          >
            {exporting ? (
              <ActivityIndicator size="small" colorClassName="accent-primary" />
            ) : (
              <Feather
                name="download"
                size={16}
                color={isDark ? '#ffffff' : '#111111'}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="mb-3 flex-row items-center rounded-2xl border border-input bg-card px-3.5">
          <Feather
            name="search"
            size={16}
            color={isDark ? '#a1a1aa' : '#71717a'}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColorClassName="accent-muted-foreground"
            cursorColorClassName="accent-primary"
            autoCapitalize="none"
            autoCorrect={false}
            className="h-11 flex-1 px-3 font-brand text-foreground text-sm"
          />

          {search.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSearch('')}
              className="size-7 items-center justify-center rounded-full bg-muted"
            >
              <Feather
                name="x"
                size={14}
                color={isDark ? '#a1a1aa' : '#71717a'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Type filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
          className="mb-3"
        >
          {filters.map((filter) => {
            const active = activeFilters === filter

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilters(filter)}
                activeOpacity={0.8}
                className={cn(
                  'rounded-full border px-4 py-2',
                  active
                    ? 'border-primary bg-primary'
                    : 'border-border bg-muted',
                )}
              >
                <Text
                  className={cn(
                    'font-brand-semibold text-xs',
                    active
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {filter === 'INCOME'
                    ? 'Income'
                    : filter === 'EXPENSE'
                      ? 'Expense'
                      : 'All'}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Account filters */}
        {accounts.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              activeOpacity={0.8}
              className={cn(
                'rounded-full border px-4 py-2',
                activeAccountId === null
                  ? 'border-primary bg-primary'
                  : 'border-border bg-muted',
              )}
            >
              <Text
                className={cn(
                  'font-brand-semibold text-xs',
                  activeAccountId === null
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                All accounts
              </Text>
            </TouchableOpacity>

            {accounts.map((account) => {
              const active = activeAccountId === account.id

              return (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => setActiveAccountId(account.id)}
                  activeOpacity={0.8}
                  className={cn(
                    'rounded-full border px-4 py-2',
                    active
                      ? 'border-primary bg-primary'
                      : 'border-border bg-muted',
                  )}
                >
                  <Text
                    className={cn(
                      'font-brand-semibold text-xs',
                      active
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {account.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      {isTransactionsLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator colorClassName="accent-primary" />
        </View>
      ) : transactionsError ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="size-14 items-center justify-center rounded-full bg-destructive/10">
            <Feather
              name="alert-circle"
              size={26}
              color={isDark ? '#ffffff' : '#111111'}
            />
          </View>

          <Text className="mt-4 text-center font-brand-semibold text-foreground text-sm">
            Couldn&apos;t load your transactions
          </Text>

          <Text className="mt-1 text-center font-brand text-muted-foreground text-xs">
            Something went wrong while loading your transaction history.
          </Text>

          <Pressable
            onPress={refetchData}
            className="mt-5 rounded-full bg-primary px-5 py-2.5"
          >
            <Text className="font-brand-semibold text-primary-foreground text-xs">
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(tx) => tx.id}
          renderItem={({ item }) => (
            <TransactionRow tx={item} onDelete={() => handleDelete(item)} />
          )}
          contentContainerClassName="px-5 pb-10 pt-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isTransactionsRefetching}
              onRefresh={refetchData}
              tintColor={isDark ? '#ffffff' : '#111111'}
            />
          }
          ListHeaderComponent={
            transactions.length > 0 ? (
              <View className="mb-4 overflow-hidden rounded-3xl border border-border bg-card">
                <View className="px-4 pt-4 pb-2">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="font-brand-semibold text-foreground text-sm">
                        Daily activity
                      </Text>

                      <Text className="mt-0.5 font-brand text-[11px] text-muted-foreground">
                        Income vs expense this month
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center gap-1.5">
                        <View className="size-2 rounded-full bg-green-500" />
                        <Text className="font-brand text-[10px] text-muted-foreground">
                          Income
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <View className="size-2 rounded-full bg-red-500" />
                        <Text className="font-brand text-[10px] text-muted-foreground">
                          Expense
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="pr-4"
                >
                  <BarChart
                    data={dailyIncomeExpense}
                    width={Math.max(dailyIncomeExpense.length * 9, 300)}
                    height={135}
                    barWidth={6}
                    spacing={4}
                    hideYAxisText
                    xAxisColor={isDark ? '#27272a' : '#e4e4e7'}
                    yAxisColor="transparent"
                    rulesColor={isDark ? '#27272a' : '#f0f0f0'}
                    noOfSections={3}
                    xAxisLabelTextStyle={{
                      color: isDark ? '#71717a' : '#8a8d96',
                      fontSize: 7,
                    }}
                    isThreeD={false}
                    roundedTop
                  />
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="size-14 items-center justify-center rounded-full bg-muted">
                <Feather
                  name={search ? 'search' : 'inbox'}
                  size={24}
                  color={isDark ? '#a1a1aa' : '#71717a'}
                />
              </View>

              <Text className="mt-4 font-brand-semibold text-foreground text-sm">
                {search ? 'No matching transactions' : 'No transactions yet'}
              </Text>

              <Text className="mt-1 text-center font-brand text-muted-foreground text-xs">
                {search
                  ? 'Try a different search term.'
                  : 'Your transactions will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
