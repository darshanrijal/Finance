import Feather from '@expo/vector-icons/Feather'
import { Text, TouchableOpacity, View } from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { type CategoryKey, getCategoryConfig } from '@/constants/categories'
import type { InputMethod, Transaction } from '@/constants/transaction'
import { useUserStore } from '@/hooks/useUser'
import { cn, formatPrice } from '@/lib/utils'

const INPUT_METHOD_ICON: Record<InputMethod, keyof typeof Feather.glyphMap> = {
  MANUAL: 'edit-3',
  RECIPT_SCAN: 'camera',
  VOICE: 'mic',
}

export function TransactionRow({
  tx,
  onDelete,
}: {
  tx: Transaction
  onDelete?: () => void
}) {
  const config = getCategoryConfig(tx.category as CategoryKey)
  const isIncome = tx.type === 'INCOME'
  const { currency } = useUserStore()

  const row = (
    <View
      className="flex-row items-center rounded-2xl border border-border bg-card py-4 pr-3.5 pl-3 dark:bg-secondary"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: config.color,
      }}
    >
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${config.color}22`,
        }}
      >
        <Text className="text-lg">{config.icon}</Text>
      </View>

      <View className="flex-1">
        <Text className="font-medium text-primary text-sm" numberOfLines={1}>
          {tx.description || config.label}
        </Text>

        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Feather
            name={INPUT_METHOD_ICON[tx.inputMethod]}
            size={11}
            color="#8A8D96"
          />

          <View
            className="rounded-full px-1.5 py-0.5"
            style={{
              backgroundColor: `${config.color}1A`,
            }}
          >
            <Text
              className="font-medium text-[10px]"
              style={{
                color: config.color,
              }}
            >
              {config.label}
            </Text>
          </View>

          {tx.isFlagged && (
            <View className="ml-1 flex-row items-center gap-1">
              <Feather name="alert-triangle" size={11} color="#FF6B4A" />

              <Text className="text-[11px] text-destructive">Flagged</Text>
            </View>
          )}
        </View>
      </View>

      <Text
        className={cn(
          'font-brand text-sm',
          isIncome ? 'text-green-600' : 'text-red-600',
        )}
      >
        {isIncome ? '+' : '-'}
        {formatPrice(tx.amount, currency)}
      </Text>
    </View>
  )

  if (!onDelete) {
    return <View className="mb-2.5">{row}</View>
  }

  return (
    <View className="mb-2.5">
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <TouchableOpacity
            onPress={onDelete}
            className="ml-2 w-16 items-center justify-center rounded-2xl bg-destructive"
          >
            <Feather name="trash-2" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      >
        {row}
      </Swipeable>
    </View>
  )
}
