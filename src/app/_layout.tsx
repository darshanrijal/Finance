import { TRPCProvider } from '@/__rpc/react'
import '@/global.css'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter'
import { useFonts } from 'expo-font'
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { authClient } from '@/lib/auth-client'

export default function RootLayout() {
  const { isPending: isAuthPending, error: authError } = authClient.useSession()

  const [fontsLoaded, fontsError] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    Inter_600SemiBold,
    Inter_900Black,
    ...Feather.font,
    ...Ionicons.font,
  })

  const loaded = fontsLoaded || !isAuthPending
  const error = fontsError || authError

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync()
    }
  }, [loaded, error])

  if (!loaded && !error) {
    return null
  }
  return (
    <TRPCProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    </TRPCProvider>
  )
}
