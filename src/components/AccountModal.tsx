import type { Account, AccountType } from "@/constants/account";
import {
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/useAccountMutation";
import { cn } from "@/lib/utils";
import { accounts } from "@/server/db/schema";
import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import FormSheetModal from "./FormSheetModal";

const ACCOUNT_TYPES = accounts.type.enumValues;

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CASH: "Cash",
  CARD: "Credit card",
  SAVINGS: "Savings",
};

const ACCOUNT_TYPE_ICON: Record<AccountType, keyof typeof Feather.glyphMap> = {
  CASH: "dollar-sign",
  CARD: "credit-card",
  SAVINGS: "archive",
};

interface AccountModalProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onMadeDefault: () => void;
}

export default function AccountModal(props: AccountModalProps) {
  const { account, open } = props;

  return (
    <AccountModalContent key={`${open}-${account?.id ?? "new"}`} {...props} />
  );
}

function AccountModalContent({
  account,
  onClose,
  onDeleted,
  onMadeDefault,
  onSaved,
  open,
}: AccountModalProps) {
  const isEditing = !!account;

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "CASH");
  const [error, setError] = useState("");

  const { mutate: createAccount, isPending: isCreatingAccount } =
    useCreateAccount();

  const { mutate: updateAccount, isPending: isUpdatingAccount } =
    useUpdateAccount();

  const { mutate: deleteAccount, isPending: isDeletingAccount } =
    useDeleteAccount();

  const saving = isCreatingAccount || isUpdatingAccount;

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter an account name.");
      return;
    }

    setError("");

    if (isEditing) {
      updateAccount(
        {
          accountId: account.id,
          name: trimmedName,
          type,
        },
        {
          onSuccess: onSaved,
          onError: () => {
            setError("Something went wrong. Please try again.");
          },
        },
      );

      return;
    }

    createAccount(
      {
        name: trimmedName,
        type,
      },
      {
        onSuccess: onSaved,
        onError: () => {
          setError("Something went wrong. Please try again.");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!account || isDeletingAccount) return;

    deleteAccount(
      { accountId: account.id },
      {
        onSuccess: (result) => {
          if (result.deleted) {
            onDeleted();
            return;
          }

          Alert.alert(
            "Delete account?",
            `This will also delete ${result.transactionCount} transaction${
              result.transactionCount === 1 ? "" : "s"
            }. This can't be undone.`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  deleteAccount(
                    {
                      accountId: account.id,
                      force: true,
                    },
                    {
                      onSuccess: onDeleted,
                      onError: () => {
                        Alert.alert(
                          "Error",
                          "Couldn't delete the account. Please try again.",
                        );
                      },
                    },
                  );
                },
              },
            ],
          );
        },
        onError: () => {
          Alert.alert("Error", "Couldn't check the account's transactions.");
        },
      },
    );
  };

  return (
    <FormSheetModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      title={isEditing ? "Edit account" : "Add account"}
    >
      <View className="gap-5">
        {/* Name */}
        <View>
          <Text className="text-foreground font-brand-semibold mb-1.5 text-xs">
            Account name
          </Text>

          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError("");
            }}
            placeholder="e.g. HDFC Savings"
            placeholderTextColorClassName="accent-muted-foreground"
            cursorColorClassName="accent-primary"
            autoCapitalize="words"
            returnKeyType="done"
            className="bg-card border-border text-card-foreground font-brand rounded-xl border px-4 py-3.5 text-sm"
          />
        </View>

        {/* Type */}
        <View>
          <Text className="text-foreground font-brand-semibold mb-1.5 text-xs">
            Account type
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map((accountType) => {
              const selected = type === accountType;

              return (
                <TouchableOpacity
                  key={accountType}
                  onPress={() => {
                    setType(accountType);
                    if (error) setError("");
                  }}
                  activeOpacity={0.7}
                  className={cn(
                    "flex-row items-center gap-1.5 rounded-full border px-3.5 py-2.5",
                    selected
                      ? "border-primary bg-primary"
                      : "border-border bg-card",
                  )}
                >
                  <Feather
                    name={ACCOUNT_TYPE_ICON[accountType]}
                    size={13}
                    color={"#737373"}
                  />

                  <Text
                    className={cn(
                      "font-brand-semibold text-xs",
                      selected
                        ? "text-primary-foreground"
                        : "text-card-foreground",
                    )}
                  >
                    {ACCOUNT_TYPE_LABEL[accountType]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View className="bg-destructive/10 flex-row items-center gap-2 rounded-xl px-3.5 py-3">
            <Feather name="alert-circle" size={15} color="#EF4444" />

            <Text className="text-destructive font-brand flex-1 text-xs">
              {error}
            </Text>
          </View>
        ) : null}

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || isDeletingAccount}
          activeOpacity={0.85}
          className={cn(
            "items-center rounded-xl py-4",
            saving ? "bg-primary/60" : "bg-primary",
          )}
        >
          <Text className="text-primary-foreground font-brand-semibold text-sm">
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add account"}
          </Text>
        </TouchableOpacity>

        {/* Edit-only actions */}
        {isEditing && (
          <View className="items-center gap-1">
            {!account.isDefault && (
              <TouchableOpacity
                onPress={onMadeDefault}
                disabled={saving || isDeletingAccount}
                activeOpacity={0.7}
                className="px-4 py-2.5"
              >
                <Text className="text-primary font-brand-semibold text-sm">
                  Make default
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleDelete}
              disabled={saving || isDeletingAccount}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 px-4 py-2.5"
            >
              <Feather name="trash-2" size={14} color="#EF4444" />

              <Text className="text-destructive font-brand-semibold text-sm">
                {isDeletingAccount ? "Deleting…" : "Delete account"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </FormSheetModal>
  );
}
