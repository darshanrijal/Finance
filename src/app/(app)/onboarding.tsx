import { trpc } from "@/__rpc/react";
import { AllCurrencies, CurrencyPicker } from "@/components/CurrencyPicker";
import { SafeAreaView } from "@/components/SafeAreaView";
import { authClient } from "@/lib/auth-client";
import { onboardingSchema, type OnboardingValues } from "@/lib/validation";
import Feather from "@expo/vector-icons/Feather";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Onboarding() {
  const {
    data,
    error,
    isPending,
    refetch: refetchUser,
    isRefetching,
  } = authClient.useSession();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      startingBalance: "",
    },
  });

  const [selectedCurrency, setSelectedCurrency] = useState(
    AllCurrencies.find((c) => c.code === "NPR") ?? AllCurrencies[0],
  );

  const [pickerOpen, setPickerOpen] = useState(false);

  const { mutateAsync: completeOnboarding } =
    trpc.onboarding.complete.useMutation({
      onSuccess: () => {
        refetchUser();
      },
      onError: (error) => {
        Alert.alert("Onboarding error", error.message);
      },
    });

  useEffect(() => {
    if (!error) return;

    Alert.alert(
      "Onboarding error",
      "We could not load your account. Please log in again.",
    );

    authClient.signOut();
  }, [error]);

  if (isPending || isRefetching) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="small" colorClassName="accent-primary" />
      </View>
    );
  }

  if (error) {
    return <Redirect href="/(app)/(auth)" />;
  }

  if (!data?.user.isRequiredOnboarding) {
    return <Redirect href="/(app)/(main)" />;
  }

  if (!selectedCurrency) {
    return null;
  }

  async function handleSave({ startingBalance }: OnboardingValues) {
    if (!selectedCurrency) {
      return;
    }
    await completeOnboarding({
      selectedCurrency: selectedCurrency.code,
      startingBalance,
    });
  }

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-6">
          {/* Header */}
          <View className="pt-10">
            <Text className="text-primary font-brand-semibold text-sm">
              LET&apos;S GET STARTED
            </Text>

            <Text className="text-foreground font-brand-bold mt-2 text-3xl leading-9">
              Set up your balance
            </Text>

            <Text className="text-muted-foreground font-brand mt-3 text-base leading-6">
              Enter the amount you currently have available. You can change this
              later.
            </Text>
          </View>

          {/* Form */}
          <View className="mt-10 gap-6">
            <Controller
              control={form.control}
              name="startingBalance"
              render={({ field, fieldState }) => (
                <View>
                  <Text className="text-foreground font-brand-semibold mb-2">
                    Starting balance
                  </Text>

                  <View
                    className={`bg-muted flex-row items-center rounded-2xl px-4 ${
                      fieldState.error ? "border-destructive border" : ""
                    }`}
                  >
                    <Text className="text-muted-foreground font-brand-semibold mr-2 text-2xl">
                      {selectedCurrency.symbol}
                    </Text>

                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      cursorColorClassName="accent-primary"
                      placeholderTextColor="#888"
                      className="text-foreground font-brand-semibold flex-1 py-4 text-2xl"
                    />
                  </View>

                  {fieldState.error && (
                    <Text className="text-destructive font-brand mt-2 text-sm">
                      {fieldState.error.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Currency */}
            <View>
              <Text className="text-foreground font-brand-semibold mb-2">
                Currency
              </Text>

              <Pressable
                onPress={() => setPickerOpen(true)}
                className="bg-muted flex-row items-center justify-between rounded-2xl px-4 py-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-foreground font-brand-semibold text-base">
                    {selectedCurrency.code}
                  </Text>

                  <Text className="text-muted-foreground font-brand">
                    {selectedCurrency.name}
                  </Text>
                </View>
                <Feather name="chevron-right" color={"white"} />
              </Pressable>
            </View>
          </View>

          {/* Bottom CTA */}
          <View className="mt-auto pt-10 pb-8">
            <Pressable
              disabled={form.formState.isSubmitting}
              onPress={form.handleSubmit(handleSave)}
              className="bg-primary items-center rounded-2xl py-4 active:opacity-90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? (
                <ActivityIndicator colorClassName="accent-primary" />
              ) : (
                <Text className="text-background font-brand-semibold text-base">
                  Continue
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CurrencyPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedCurrency={selectedCurrency}
        onSelect={(currency) => {
          setSelectedCurrency(currency);
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
