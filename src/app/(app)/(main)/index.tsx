import { authClient } from "@/lib/auth-client";
import { Text, View } from "react-native";

export default function MainIndexScreen() {
  const { data } = authClient.useSession();
  return (
    <View className="bg-background flex-1 items-center justify-center">
      <Text className="text-foreground">{JSON.stringify(data, null, 2)}</Text>
    </View>
  );
}
