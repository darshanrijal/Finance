import { SafeAreaView } from "@/components/SafeAreaView";
import { authClient } from "@/lib/auth-client";
import { Button } from "react-native";

export default function Profile() {
  return (
    <SafeAreaView>
      <Button
        title="Sign out"
        colorClassName="accent-primary"
        onPress={() => {
          authClient.signOut({});
        }}
      />
    </SafeAreaView>
  );
}
