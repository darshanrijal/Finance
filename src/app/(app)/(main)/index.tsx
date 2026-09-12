import { trpc } from "@/__rpc/react";
import BudgetModal from "@/components/BudgetModal";
import { SafeAreaView } from "@/components/SafeAreaView";
import { TransactionRow } from "@/components/TransactionRow";
import {
  CATEGORIES,
  CategoryKey,
  getCategoryConfig,
} from "@/constants/categories";
import { authClient } from "@/lib/auth-client";
import { formatPrice } from "@/lib/utils";
import Feather from "@expo/vector-icons/Feather";
import { isSameMonth } from "date-fns";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useUniwind } from "uniwind";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

const QUICK_ACTIONS = [
  {
    icon: "camera",
    label: "AI Receipt Scan",
    action: "scan",
    color: "#1A85FF",
  },
  {
    icon: "mic",
    label: "Voice Entry",
    action: "voice",
    color: "#FF6B4A",
  },
  {
    icon: "plus",
    label: "Add Manually",
    action: "manual",
    color: "#3DDC84",
  },
] as const;

export default function MainIndexScreen() {
  const { data: sessionData } = authClient.useSession();
  const router = useRouter();
  const isDark = useUniwind().theme === "dark";
  const currency = sessionData?.user.currency ?? "NPR";
  const [budgetModelOpen, setBudgetModelOpen] = useState(false);

  const {
    data: accounts,
    isPending: isLoadingAccounts,
    error: accountsError,
    refetch: refetchAccounts,
    isRefetching: isAccountRefetching,
  } = trpc.accounts.getAccounts.useQuery();

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
    isRefetching: isRefetchingTransactions,
  } = trpc.transactions.getTransactions.useQuery({});

  const {
    data: budget,
    refetch: refetchBudget,
    isPending: isLoadingBudget,
    error: budgetsError,
  } = trpc.budget.getBudget.useQuery();

  const isLoading = isLoadingAccounts || isLoadingTransactions;
  const refreshing = isAccountRefetching || isRefetchingTransactions;

  const onRefresh = () => {
    refetchAccounts();
    refetchBudget();
    refetchTransactions();
  };

  const totalBalance = useMemo(
    () => accounts?.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions?.filter((tx) => isSameMonth(tx.date, now));
  }, [transactions]);

  const monthIncome = useMemo(
    () =>
      monthTransactions
        ?.filter((tx) => tx.type === "INCOME")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions],
  );

  const monthExpense = useMemo(
    () =>
      monthTransactions
        ?.filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions],
  );

  const recentTransactions = useMemo(
    () => transactions?.slice(0, 5),
    [transactions],
  );

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    monthTransactions
      ?.filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
      });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        color:
          CATEGORIES[category as keyof typeof CATEGORIES]?.color ?? "#999999",
      }));
  }, [monthTransactions]);

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerClassName="pb-6"
      >
        {/* Header */}
        <View className="bg-card rounded-b-[30px] px-5 pt-5 pb-7">
          <View className="mb-8 flex-row items-center justify-between">
            {/* Logo */}
            <View className="bg-primary size-11 items-center justify-center rounded-[17px]">
              <Text className="font-brand-bold text-primary-foreground text-lg">
                F
              </Text>
            </View>

            {/* User */}
            <View className="flex-row items-center gap-3">
              <View className="items-end">
                <Text className="font-brand text-muted-foreground mb-0.5 text-[11px]">
                  {getGreeting()}
                </Text>

                <Text
                  className="font-brand-semibold text-card-foreground max-w-37.5 text-[15px]"
                  numberOfLines={1}
                >
                  {sessionData?.user.name ?? "there"}
                </Text>
              </View>

              <TouchableOpacity
                className="bg-muted size-11 items-center justify-center overflow-hidden rounded-full"
                onPress={() => router.push("/profile")}
                activeOpacity={0.8}
              >
                {sessionData?.user.image ? (
                  <Image
                    source={{ uri: sessionData.user.image }}
                    style={{
                      width: 44,
                      height: 44,
                      resizeMode: "cover",
                    }}
                  />
                ) : (
                  <Feather name="user" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance */}
          <View>
            <Text className="font-brand text-muted-foreground mb-1.5 text-xs">
              Total Balance
            </Text>

            <Text className="font-brand-bold text-primary text-[30px]">
              {totalBalance ? formatPrice(totalBalance, currency) : "___"}
            </Text>

            <View className="mt-4 flex-row gap-5">
              <View className="flex-row items-center gap-1.5">
                <View className="size-6 items-center justify-center rounded-full bg-green-500/10">
                  <Feather name="arrow-up-right" size={13} color="#009900" />
                </View>

                <View>
                  <Text className="font-brand text-muted-foreground text-[10px]">
                    Income
                  </Text>
                  <Text className="font-brand-semibold text-xs text-green-600">
                    {formatPrice(monthIncome ?? 0, currency)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                <View className="size-6 items-center justify-center rounded-full bg-red-500/10">
                  <Feather name="arrow-down-right" size={13} color="#990000" />
                </View>

                <View>
                  <Text className="font-brand text-muted-foreground text-[10px]">
                    Expenses
                  </Text>
                  <Text className="font-brand-semibold text-xs text-red-600">
                    {formatPrice(monthExpense ?? 0, currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-6 flex-row gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.action}
                onPress={() =>
                  router.push({
                    pathname: "/transactions",
                    params: { action: action.action },
                  })
                }
                activeOpacity={0.75}
                className="dark:bg-secondary bg-card border-border flex-1 items-center justify-center gap-2.5 rounded-[18px] border px-2 py-4"
              >
                <View
                  className="size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${action.color}26` }}
                >
                  <Feather name={action.icon} size={17} color={action.color} />
                </View>

                <Text className="font-brand-semibold dark:text-primary text-card-foreground text-center text-[11px] leading-4">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-5 pt-4.5 pb-5">
          <TouchableOpacity
            onPress={() => router.push("/assistant")}
            className="border-border bg-secondary mb-4.5 flex-row items-center gap-2.5 rounded-2xl border p-3.5"
            activeOpacity={0.8}
          >
            <View className="size-6.5 items-center justify-center rounded-full">
              <View className="bg-secondary-foreground size-2 animate-pulse rounded-full" />
            </View>
            <Text className="text-muted-foreground flex-1 text-[13px]">
              Ask AI anything about your money
            </Text>
            <Feather
              name="arrow-right"
              size={16}
              color={isDark ? "white" : "black"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setBudgetModelOpen(true)}
            activeOpacity={0.85}
            className="bg-secondary border-border mb-4.5 rounded-[18px] border p-4"
          >
            <View className="mb-2.5 flex-row items-center justify-between">
              <Text className="text-primary font-brand-semibold text-sm">
                Monthly budget
              </Text>
              <Feather
                name="edit-2"
                size={13}
                color={isDark ? "white" : "black"}
              />
            </View>
            {budget ? (
              <>
                <Text className="text-primary mb-2 text-xs">
                  {formatPrice(monthExpense ?? 0, currency)} of{" "}
                  {formatPrice(budget.amount, currency)} spent
                </Text>
                <View className="bg-primary h-2 overflow-hidden rounded-full">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        Math.round(((monthExpense ?? 0) / budget.amount) * 100),
                        100,
                      )}%`,
                      backgroundColor:
                        (monthExpense ?? 0) >= budget.amount
                          ? "#FF6B4A"
                          : (monthExpense ?? 0) >= budget.amount * 0.8
                            ? "#F7DC6F"
                            : "#3DDC84",
                    }}
                  />
                </View>
              </>
            ) : (
              <Text className="text-muted-foreground text-xs">
                Tap to set a monthly spending budget
              </Text>
            )}
          </TouchableOpacity>

          {expenseBreakdown.length > 0 && (
            <View className="bg-secondary border-border mb-5 rounded-[18px] border p-4">
              <Text className="text-primary font-brand-semibold mb-3 text-sm">
                Expense Breakdown
              </Text>
              <View className="flex-row items-center">
                <PieChart
                  data={expenseBreakdown.map((c) => ({
                    value: c.amount,
                    color: c.color,
                  }))}
                  radius={60}
                  innerRadius={38}
                  innerCircleColor={"#fff"}
                />
                <View className="ml-4 flex-1 gap-1.5">
                  {expenseBreakdown.slice(0, 6).map((c) => (
                    <View
                      key={c.category}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-1.5">
                        <View
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <Text className="text-primary text-[11px]">
                          {getCategoryConfig(c.category as CategoryKey).label}
                        </Text>
                      </View>
                      <Text className="text-primary text-[11px] font-medium">
                        {formatPrice(c.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-primary font-brand-semibold text-sm">
              Recent transactions
            </Text>
            <TouchableOpacity onPress={() => router.push("/transactions")}>
              <Text className="text-muted-foreground text-xs">See all</Text>
            </TouchableOpacity>
          </View>
          {(() => {
            if (isLoading) {
              return (
                <View className="items-center py-6">
                  <ActivityIndicator color={isDark ? "white" : "black"} />
                </View>
              );
            }

            if (recentTransactions?.length === 0) {
              return (
                <View className="items-center py-6">
                  <Feather
                    name="inbox"
                    size={28}
                    color={isDark ? "white" : "black"}
                  />
                  <Text className="text-brand-text-muted mt-3 text-sm">
                    No transactions yet
                  </Text>
                </View>
              );
            }

            return recentTransactions?.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ));
          })()}
        </View>
      </ScrollView>

      <BudgetModal
        visible={budgetModelOpen}
        onVisibilityChange={setBudgetModelOpen}
        budget={budget}
        onClose={() => setBudgetModelOpen(false)}
        onSave={() => setBudgetModelOpen(false)}
      />
    </SafeAreaView>
  );
}
