import { trpc } from "@/__rpc/react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {
  const { data, isPending, error } = trpc.health.useQuery();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size={"large"} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-center text-red-500">{error.message}</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 items-center justify-center">
      <Text>Resolved Data</Text>
      <Text>{JSON.stringify(data, null, 2)}</Text>
    </View>
  );
}
