import { trpc } from "@/__rpc/react";
import { Budget } from "@/constants/Budget";
import { useState } from "react";
import { Text } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import FormSheetModal from "./FormSheetModal";

interface BudgetModalProps {
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  budget?: Budget | null;
  onClose: () => void;
  onSave: () => void;
}
export default function BudgetModal({
  budget,
  onClose,
  onSave,
  visible,
  onVisibilityChange,
}: BudgetModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const { mutateAsync: upsertBudget, isPending } =
    trpc.budget.upsertBudget.useMutation({
      onSuccess: (budget) => {
        utils.budget.getBudget.invalidate();
        setAmount(budget.amount.toString());
      },
      onError: (error) => {
        setError(error.message);
      },
    });

  async function handleSave() {
    setError("");
  }

  return (
    <FormSheetModal
      open={visible}
      onOpenChange={onVisibilityChange}
      title={budget ? "Edit montly budget" : "Set monthly budget"}
    >
      <Text className="text-card-foreground font-brand">Montly Budget</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g 5000"
        cursorColorClassName="accent-primary"
        keyboardType="numeric"
        autoFocus
        className="dark:bg-secondary border-border text-primary mb-5 rounded-xl border bg-white px-4 py-3 text-sm"
      />

      {!!error && (
        <Text className="text-destructive font-brand mb-3 text-xs">
          {error}
        </Text>
      )}
    </FormSheetModal>
  );
}
