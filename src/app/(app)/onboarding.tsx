import Feather from '@expo/vector-icons/Feather'
import { zodResolver } from '@hookform/resolvers/zod'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { trpc } from '@/__rpc/react'
import { AllCurrencies, CurrencyPicker } from '@/components/CurrencyPicker'
import { SafeAreaView } from '@/components/SafeAreaView'
import { authClient } from '@/lib/auth-client'
import { type OnboardingValues, onboardingSchema } from '@/lib/validation'

export default function Onboarding() {
  const {
    data,
    error,
    isPending,
    refetch: refetchUser,
    isRefetching,
  } = authClient.useSession()
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      startingBalance: '',
    },
  })

  const [selectedCurrency, setSelectedCurrency] = useState(
    AllCurrencies.find((c) => c.code === 'NPR') ?? AllCurrencies[0],
  )

  const [pickerOpen, setPickerOpen] = useState(false)

  const { mutateAsync: completeOnboarding } =
    trpc.onboarding.complete.useMutation({
      onSuccess: () => {
        refetchUser()
      },
      onError: (error) => {
        Alert.alert('Onboarding error', error.message)
      },
    })

  useEffect(() => {
    if (!error) return

    Alert.alert(
      'Onboarding error',
      'We could not load your account. Please log in again.',
    )

    authClient.signOut()
  }, [error])

  if (isPending || isRefetching) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" colorClassName="accent-primary" />
      </View>
    )
  }

  if (error) {
    return <Redirect href="/(app)/(auth)" />
  }

  if (!data?.user.isRequiredOnboarding) {
    return <Redirect href="/(app)/(main)" />
  }

  if (!selectedCurrency) {
    return null
  }

  async function handleSave({ startingBalance }: OnboardingValues) {
    if (!selectedCurrency) {
      return
    }
    await completeOnboarding({
      selectedCurrency: selectedCurrency.code,
      startingBalance,
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6">
          {/* Header */}
          <View className="pt-10">
            <Text className="font-brand-semibold text-primary text-sm">
              LET&apos;S GET STARTED
            </Text>

            <Text className="mt-2 font-brand-bold text-3xl text-foreground leading-9">
              Set up your balance
            </Text>

            <Text className="mt-3 font-brand text-base text-muted-foreground leading-6">
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
                  <Text className="mb-2 font-brand-semibold text-foreground">
                    Starting balance
                  </Text>

                  <View
                    className={`flex-row items-center rounded-2xl bg-muted px-4 ${
                      fieldState.error ? 'border border-destructive' : ''
                    }`}
                  >
                    <Text className="mr-2 font-brand-semibold text-2xl text-muted-foreground">
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
                      className="flex-1 py-4 font-brand-semibold text-2xl text-foreground"
                    />
                  </View>

                  {fieldState.error && (
                    <Text className="mt-2 font-brand text-destructive text-sm">
                      {fieldState.error.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Currency */}
            <View>
              <Text className="mb-2 font-brand-semibold text-foreground">
                Currency
              </Text>

              <Pressable
                onPress={() => setPickerOpen(true)}
                className="flex-row items-center justify-between rounded-2xl bg-muted px-4 py-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="font-brand-semibold text-base text-foreground">
                    {selectedCurrency.code}
                  </Text>

                  <Text className="font-brand text-muted-foreground">
                    {selectedCurrency.name}
                  </Text>
                </View>
                <Feather name="chevron-right" color={'white'} />
              </Pressable>
            </View>
          </View>

          {/* Bottom CTA */}
          <View className="mt-auto pt-10 pb-8">
            <Pressable
              disabled={form.formState.isSubmitting}
              onPress={form.handleSubmit(handleSave)}
              className="items-center rounded-2xl bg-primary py-4 active:opacity-90 disabled:opacity-50"
            >
              {form.formState.isSubmitting ? (
                <ActivityIndicator colorClassName="accent-primary" />
              ) : (
                <Text className="font-brand-semibold text-background text-base">
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
          setSelectedCurrency(currency)
          setPickerOpen(false)
        }}
      />
    </SafeAreaView>
  )
}
