import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { useTransition } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthIndexScreen() {
  const insets = useSafeAreaInsets();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleGoogleSignIn() {
    startTransition(async () => {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/onboarding",
      });
      if (error) {
        Alert.alert("Sign in error", error.message);
        return;
      }
      router.replace("/onboarding");
    });
  }

  return (
    <View
      className="bg-background flex-1 px-6"
      style={{
        paddingBottom: insets.bottom,
      }}
    >
      <View className="flex-1 items-center justify-center">
        {/* Illustration */}
        <View className="bg-card mb-10 h-56 w-56 items-center justify-center rounded-[40px]">
          <Image
            source={require("@/assets/images/auth_screen_image_money.png")}
            className="h-48 w-48"
            resizeMode="contain"
          />
        </View>

        {/* Heading */}
        <View className="w-full gap-4">
          <Text className="text-foreground font-brand-bold text-center text-[34px] leading-10">
            Managing your money is <Text className="text-primary">easier</Text>{" "}
            than you think.
          </Text>

          <Text className="text-muted-foreground font-brand text-center text-base leading-6">
            Take control of your finances and make every rupee count.
          </Text>
        </View>
      </View>

      {/* Bottom actions */}
      <View className="w-full gap-4 pb-8">
        <Pressable
          className="bg-primary disabled:bg-primary/50 flex-row items-center justify-center rounded-2xl py-4 active:opacity-90"
          disabled={isPending}
          onPress={handleGoogleSignIn}
        >
          {isPending ? (
            <ActivityIndicator
              size={"small"}
              colorClassName="accent-primary"
              className="mr-3"
            />
          ) : (
            <Image
              source={require("@/assets/images/google_logo.png")}
              className="mr-3 h-5 w-5"
              resizeMode="contain"
            />
          )}

          <Text className="text-background font-brand-semibold text-base">
            Continue with Google
          </Text>
        </Pressable>

        <Text className="text-muted-foreground font-brand text-center text-xs leading-5">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}
