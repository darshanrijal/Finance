import { trpc } from "@/__rpc/react";
import { authClient } from "@/lib/auth-client";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

export default function Onboarding() {
  const { data, isPending, error } = trpc.budget.getBudget.useQuery();

  useEffect(() => {
    if (!error) return;

    Alert.alert(
      "Onboarding error",
      "We could not load your account. Please log in again.",
    );

    authClient.signOut();
  }, [error]);

  if (isPending) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="small" colorClassName="accent-primary" />
      </View>
    );
  }

  if (error) {
    return <Redirect href="/(app)/(auth)" />;
  }

  if (data !== "NO_BUDGET_SET") {
    return <Redirect href="/(app)/(main)" />;
  }

  return (
    <View>
      <Text>Complete your onboarding</Text>
    </View>
  );
}
