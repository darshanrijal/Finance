import Ionicons from '@expo/vector-icons/Ionicons'
import cc from 'currency-codes'
import getSymbol from 'currency-symbol-map'
import { useMemo, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useResolveClassNames } from 'uniwind'

export const AllCurrencies: CurrencyEntry[] = cc
  .codes()
  .map((code) => ({
    code,
    name: cc.code(code)?.currency ?? code,
    symbol: getSymbol(code) ?? code,
  }))
  .filter((c) => c.symbol !== c.code)

export type CurrencyEntry = {
  code: string
  name: string
  symbol: string
}

interface CurrencyPickerProps {
  open: boolean
  selectedCurrency: CurrencyEntry
  onClose: () => void
  onSelect: (currency: CurrencyEntry) => void
}

interface CurrencyPickerProps {
  open: boolean
  selectedCurrency: CurrencyEntry
  onClose: () => void
  onSelect: (currency: CurrencyEntry) => void
}

interface CurrencyPickerProps {
  open: boolean
  selectedCurrency: CurrencyEntry
  onClose: () => void
  onSelect: (currency: CurrencyEntry) => void
}

export function CurrencyPicker({
  open,
  selectedCurrency,
  onClose,
  onSelect,
}: CurrencyPickerProps) {
  const [search, setSearch] = useState('')

  const currencies = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return AllCurrencies

    return AllCurrencies.filter(
      (currency) =>
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query),
    )
  }, [search])

  function handleSelect(currency: CurrencyEntry) {
    onSelect(currency)
    setSearch('')
    onClose()
  }

  function handleClose() {
    setSearch('')
    onClose()
  }

  const foregroundColor = useResolveClassNames('text-foreground')
  const mutedForegroundColor = useResolveClassNames('text-muted-foreground')
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Pressable
          onPress={handleClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Bottom sheet */}
        <View className="max-h-[85%] rounded-t-4xl bg-background px-5 pt-3 pb-8">
          {/* Drag handle */}
          <View className="mb-5 items-center">
            <View className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </View>

          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-brand-bold text-2xl text-foreground">
                Choose currency
              </Text>

              <Text className="mt-1 font-brand text-muted-foreground">
                Select your default currency
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              hitSlop={10}
              className="ml-4 h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70"
            >
              <Ionicons name="close" size={22} color={foregroundColor.color} />
            </Pressable>
          </View>

          {/* Search */}
          <View className="mb-4 flex-row items-center rounded-2xl bg-muted px-4">
            <Ionicons
              name="search"
              size={20}
              className="mr-3"
              color={mutedForegroundColor.color}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search currency"
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              className="flex-1 py-3.5 font-brand text-base text-foreground"
            />

            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch('')}
                hitSlop={10}
                className="ml-2"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={mutedForegroundColor.color}
                />
              </Pressable>
            )}
          </View>

          {/* Results */}
          <FlatList
            data={currencies}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 16,
              flexGrow: currencies.length === 0 ? 1 : undefined,
            }}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCurrency.code

              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  className={`mb-1 flex-row items-center rounded-2xl px-3 py-3.5 ${
                    isSelected ? 'bg-primary/10' : 'active:bg-muted'
                  }`}
                >
                  {/* Currency symbol */}
                  <View
                    className={`mr-3 h-11 w-11 items-center justify-center rounded-xl ${
                      isSelected ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <Text
                      className={`font-brand-semibold text-lg ${
                        isSelected ? 'text-background' : 'text-muted-foreground'
                      }`}
                    >
                      {item.symbol}
                    </Text>
                  </View>

                  {/* Currency info */}
                  <View className="flex-1">
                    <Text className="font-brand-semibold text-base text-foreground">
                      {item.name}
                    </Text>

                    <Text className="mt-0.5 font-brand text-muted-foreground text-sm">
                      {item.code}
                    </Text>
                  </View>

                  {/* Selected */}
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      className="text-primary"
                    />
                  )}
                </Pressable>
              )
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-10">
                <Ionicons
                  name="search-outline"
                  size={32}
                  className="mb-3 text-muted-foreground"
                />

                <Text className="font-brand-semibold text-foreground">
                  No currency found
                </Text>

                <Text className="mt-1 text-center font-brand text-muted-foreground">
                  Try searching by name or currency code.
                </Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
