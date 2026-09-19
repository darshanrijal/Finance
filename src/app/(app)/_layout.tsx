import { Stack } from 'expo-router'
import { authClient } from '@/lib/auth-client'

export default function AppLayout() {
  const { data } = authClient.useSession()

  const isAuthenticated = !!data?.session.id

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(main)" />
      </Stack.Protected>

      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}
