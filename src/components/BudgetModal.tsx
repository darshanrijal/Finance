import { useState } from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { trpc } from '@/__rpc/react'
import type { Budget } from '@/constants/Budget'
import FormSheetModal from './FormSheetModal'

interface BudgetModalProps {
  visible: boolean
  onVisibilityChange: (visible: boolean) => void
  budget?: Budget | null
  onClose: () => void
  onSave: () => void
}
export default function BudgetModal({
  budget,
  onClose,
  onSave,
  visible,
  onVisibilityChange,
}: BudgetModalProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const utils = trpc.useUtils()
  const { mutateAsync: upsertBudget, isPending } =
    trpc.budget.upsertBudget.useMutation({
      onSuccess: (budget) => {
        utils.budget.getBudget.invalidate()
        setAmount(budget.amount.toString())
      },
      onError: (error) => {
        setError(error.message)
      },
    })

  async function handleSave() {
    setError('')
    const parsedAmount = Number.parseFloat(amount.replace(/,/g, ''))
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid monthly budget')
      return
    }

    await upsertBudget(
      { amount: parsedAmount },
      {
        onSuccess: () => {
          onSave()
        },
      },
    )
  }

  return (
    <FormSheetModal
      open={visible}
      onOpenChange={onVisibilityChange}
      title={budget ? 'Edit montly budget' : 'Set monthly budget'}
    >
      <Text className="font-brand text-card-foreground">Montly Budget</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g 5000"
        cursorColorClassName="accent-primary"
        keyboardType="numeric"
        placeholderTextColorClassName="dark:accent-muted-foreground"
        autoFocus
        className="mb-5 rounded-xl border border-border bg-white px-4 py-3 text-primary text-sm dark:bg-secondary"
      />

      {!!error && (
        <Text className="mb-3 font-brand text-destructive text-xs">
          {error}
        </Text>
      )}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isPending}
        className="mb-3 items-center rounded-xl bg-primary py-4"
        activeOpacity={0.85}
      >
        <Text className="font-brand-semibold text-primary-foreground text-sm">
          {isPending ? 'Saving…' : 'Save budget'}
        </Text>
      </TouchableOpacity>
    </FormSheetModal>
  )
}
