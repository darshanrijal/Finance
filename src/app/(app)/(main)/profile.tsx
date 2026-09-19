import Feather from '@expo/vector-icons/Feather'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { type PropsWithChildren, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useResolveClassNames } from 'uniwind'
import { trpc } from '@/__rpc/react'
import AccountModal from '@/components/AccountModal'
import {
  AllCurrencies,
  CurrencyEntry,
  CurrencyPicker,
} from '@/components/CurrencyPicker'
import { SafeAreaView } from '@/components/SafeAreaView'
import type { Account, AccountType } from '@/constants/account'
import { useUserStore } from '@/hooks/useUser'
import { authClient } from '@/lib/auth-client'
import { cn, formatPrice } from '@/lib/utils'

const accountIcon: Record<AccountType, keyof typeof Feather.glyphMap> = {
  CASH: 'dollar-sign',
  CARD: 'credit-card',
  SAVINGS: 'shield',
}

function SectionLabel({ children }: PropsWithChildren) {
  return (
    <Text className="mx-5 mt-6 mb-2 text-[11px] text-muted-foreground uppercase">
      {children}
    </Text>
  )
}

interface RowProps {
  icon: keyof typeof Feather.glyphMap
  label: string
  value?: string
  onPress?: () => void
  showChevron?: boolean
  danger?: boolean
}
function Row({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
}: RowProps) {
  const isInteractive = !!onPress

  const iconColor = useResolveClassNames(
    danger ? 'text-destructive' : 'text-muted-foreground',
  ).color

  const mutedColor = useResolveClassNames('text-muted-foreground').color

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.7}
      className={cn(
        'flex-row items-center px-4 py-3.5',
        isInteractive && 'active:bg-muted/50',
      )}
    >
      <View
        className={cn(
          'mr-3 size-9 items-center justify-center rounded-xl',
          danger ? 'bg-destructive/10' : 'bg-muted',
        )}
      >
        <Feather name={icon} size={16} color={iconColor} />
      </View>

      <Text
        className={cn(
          'flex-1 font-brand text-sm',
          danger ? 'text-destructive' : 'text-foreground',
        )}
      >
        {label}
      </Text>

      {value && (
        <Text
          numberOfLines={1}
          className="mr-2 max-w-[120px] font-brand-semibold text-muted-foreground text-xs"
        >
          {value}
        </Text>
      )}

      {showChevron && isInteractive && (
        <Feather name="chevron-right" size={17} color={mutedColor} />
      )}
    </TouchableOpacity>
  )
}
export default function Profile() {
  const { data, refetch: refetchUser } = authClient.useSession()
  const router = useRouter()
  const { currency, setCurrency } = useUserStore()
  const [modalVisible, setmodalVisible] = useState(false)
  const [editingAccount, seteditingAccount] = useState<Account | null>(null)
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
  } = trpc.accounts.getAccounts.useQuery()

  const { mutateAsync: setDefaultAccount } =
    trpc.accounts.setDefaultAccount.useMutation()

  const closeModal = () => {
    setmodalVisible(false)
    seteditingAccount(null)
  }

  if (!data) {
    return null
  }
  const user = data.user

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.replace('/(app)/(auth)')
              },
            },
          })
        },
      },
    ])
  }

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access to set profile picture',
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (result.canceled) {
      return
    }

    const asset = result.assets[0]
    if (!asset) {
      return
    }

    const filename = asset.uri.split('/').pop() || 'avatar.jpg'
    const match = /\.(\w+)$/.exec(filename)
    const mimeType = match ? `image/${match[1]}` : 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${asset?.base64}`

    setUploadingAvatar(true)

    await authClient.updateUser({
      image: dataUrl,
      fetchOptions: {
        onError: () => {
          Alert.alert('Error', "Couldn't upload your photo. Please try again")
        },
        onSuccess: () => {
          refetchUser()
        },
        onResponse: () => {
          setUploadingAvatar(false)
        },
      },
    })
  }

  const handleMakeDefault = async () => {
    if (!editingAccount) {
      return
    }

    await setDefaultAccount(
      { accountId: editingAccount.id },
      {
        onSuccess: () => {
          closeModal()
        },
        onError: (error) => {
          Alert.alert('Error setting default account', error.message)
        },
      },
    )
  }
  const handleCurrencySelect = async (currency: CurrencyEntry) => {
    setCurrencyPickerOpen(false)
    setCurrency(
      { currency: currency.code },
      {
        onError: () => {
          Alert.alert('Error', "Couldn't update currency")
        },
      },
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-25"
      >
        <View className="px-5 pt-3 pb-2">
          <Text className="font-brand-semibold text-foreground text-xl">
            Profile
          </Text>
        </View>

        <View className="mx-5 mt-2 items-center rounded-2xl bg-card px-5 py-6">
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
            className="size-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-card"
          >
            {uploadingAvatar ? (
              <ActivityIndicator colorClassName="accent-primary" />
            ) : user.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
              />
            ) : (
              <Feather name="user" size={30} color={'#8a8d96'} />
            )}
            <View className="absolute inset-x-0 bottom-0 h-6 items-center justify-center bg-black/50">
              <Feather name="camera" size={13} color="#F2EFE9" />
            </View>
          </TouchableOpacity>
          <Text className="mt-2 font-brand-semibold text-foreground text-lg">
            {user.name}
          </Text>

          <Text className="font-brand text-muted-foreground text-xs">
            {user.email}
          </Text>
        </View>

        <SectionLabel>Accounts</SectionLabel>
        <View className="mx-5 overflow-hidden rounded-2xl border border-border">
          {loadingAccounts ? (
            <View className="items-center bg-card px-4 py-5">
              <ActivityIndicator color="#5C5F68" />
            </View>
          ) : accountsError ? (
            <View className="items-center bg-card px-4 py-5">
              <Text className="text-brand-text-muted text-xs">
                Couldn&apos;t load your accounts.
              </Text>
            </View>
          ) : (
            accounts.map((account) => (
              <Row
                key={account.id}
                icon={accountIcon[account.type]}
                label={account.name + (account.isDefault ? ' (default)' : '')}
                value={formatPrice(account.balance, currency)}
                onPress={() => {
                  seteditingAccount(account)
                  setmodalVisible(true)
                }}
              />
            ))
          )}
          <Row
            icon="plus"
            label="Add account"
            onPress={() => {
              seteditingAccount(null)
              setmodalVisible(true)
            }}
          />
        </View>

        <SectionLabel>Preferences</SectionLabel>
        <View className="mx-5 overflow-hidden rounded-2xl border border-border">
          <Row
            icon="dollar-sign"
            label="Currency"
            value={currency}
            onPress={() => setCurrencyPickerOpen(true)}
          />
        </View>

        <SectionLabel>Actions</SectionLabel>

        <View className="mx-5 overflow-hidden rounded-2xl border border-border">
          <Row
            icon="log-out"
            label="Sign out"
            onPress={handleSignOut}
            showChevron={false}
            danger
          />
        </View>
      </ScrollView>
      <AccountModal
        open={modalVisible}
        account={editingAccount}
        onClose={closeModal}
        onSaved={closeModal}
        onDeleted={closeModal}
        onMadeDefault={handleMakeDefault}
      />
      <CurrencyPicker
        open={currencyPickerOpen}
        selectedCurrency={
          AllCurrencies.find((c) => c.code === currency) ?? AllCurrencies[0]!
        }
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyPickerOpen(false)}
      />
    </SafeAreaView>
  )
}
