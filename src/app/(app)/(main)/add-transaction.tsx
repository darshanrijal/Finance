import { trpc } from "@/__rpc/react";
import { AIActionCard } from "@/components/AIActionCard";
import { CalendarPicker } from "@/components/CalendarPicker";
import { PillGroup } from "@/components/PillGroup";
import ReciptScannerModal from "@/components/ReciptScannerModal";
import { SafeAreaView } from "@/components/SafeAreaView";
import type { Account } from "@/constants/account";
import {
  CategoryKey,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/constants/categories";
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from "@/constants/theme";
import type { InputMethod } from "@/constants/transaction";
import { useCreateTransaction } from "@/hooks/useTransactionMutations";
import type { ReceiptTransaction } from "@/lib/ai";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  addTransactionSchema,
  type AddTransactionValues,
} from "@/lib/validation";
import Feather from "@expo/vector-icons/Feather";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDate, isValid } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DEFAULT_VALUES = (accounts: Account[]): AddTransactionValues => ({
  type: "EXPENSE",
  amount: "",
  category: EXPENSE_CATEGORIES[0]?.key ?? "food",
  accountId: accounts[0]?.id ?? "",
  description: "",
  date: new Date(),
});

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Expense" },
  { key: "INCOME" as const, label: "Income" },
];

export default function AddTransaction() {
  const { data: userData } = authClient.useSession();
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
  } = trpc.accounts.getAccounts.useQuery();

  const { mutateAsync: createTransaction, isPending: saving } =
    useCreateTransaction();

  const [error, setError] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL");
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { mutateAsync: extractTransactionFromReceipt } =
    trpc.ai.extractTransactionFromReceipt.useMutation();

  const form = useForm<AddTransactionValues>({
    resolver: zodResolver(addTransactionSchema),
    defaultValues: DEFAULT_VALUES([]),
  });

  const type = useWatch({
    control: form.control,
    name: "type",
  });

  const category = useWatch({
    control: form.control,
    name: "category",
  });

  const accountId = useWatch({
    control: form.control,
    name: "accountId",
  });

  const date = useWatch({
    control: form.control,
    name: "date",
  });

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // defaultValues only run once, before the accounts query finishes.
  // Set the first account once accounts become available.
  useEffect(() => {
    if (!accounts.length || form.getValues("accountId")) {
      return;
    }

    form.setValue("accountId", accounts?.[0]?.id ?? "");
  }, [accounts, form]);

  async function onSubmit(values: AddTransactionValues) {
    if (!userData?.user.id) {
      setError("You need to be signed in to add a transaction.");
      return;
    }

    setError("");

    const parsedAmount = Number(values.amount.replace(/,/g, ""));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    await createTransaction(
      {
        ...values,
        amount: parsedAmount.toString(),
        inputMethod,
        voiceTranscript: inputMethod === "VOICE" ? voiceTranscript : null,
      },
      {
        onError: (error) => {
          setError(error.message);
        },
        onSuccess: () => {
          form.reset(DEFAULT_VALUES(accounts));
          setInputMethod("MANUAL");
          setVoiceTranscript(null);
          setError("");

          router.replace("/transactions");
        },
      },
    );
  }

  const applyExtraction = (result: ReceiptTransaction) => {
    const categoryList =
      result.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const isValidCategory = (key: CategoryKey | null): key is CategoryKey =>
      !!key && categoryList.some((c) => c.key === key);

    if (result.type) form.setValue("type", result.type);
    if (isValidCategory(result.category))
      form.setValue("category", result.category);
    if (result.amount != null) form.setValue("amount", String(result.amount));
    if (result.description) form.setValue("description", result.description);
    if (result.date) {
      const parsedDate = new Date(result.date);
      if (isValid(parsedDate) && parsedDate <= new Date()) {
        form.setValue("date", parsedDate);
      }
    }

    const missing = [
      result.amount == null && "amount",
      !isValidCategory(result.category) && "category",
    ].filter(Boolean);
    if (missing.length > 0) {
      Alert.alert(
        "Review before saving",
        `Couldn't confidently read the ${missing.join(" and ")}. Please fill it in.`,
      );
    }
  };

  const handleVoiceExtracted = (result: ReceiptTransaction) => {
    applyExtraction(result);
    setVoiceTranscript(result.transcript);
    setInputMethod("VOICE");
  };
  const handleReciptCaptured = async (base64: string, mimetype: string) => {
    setScannerOpen(false);
    setScanning(true);
    await extractTransactionFromReceipt(
      {
        base64Image: base64,
        mimeType: mimetype,
      },
      {
        onSuccess: (data) => {
          applyExtraction(data);
          setInputMethod("RECIPT_SCAN");
        },
        onError: () => {
          Alert.alert(
            "Recipt extracting error",
            "We could not extract the details from your provided receipt",
          );
        },
        onSettled: () => {
          setScanning(false);
        },
      },
    );
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View className="px-5 pt-3 pb-3">
        <Text className="font-brand-semibold text-foreground text-xl">
          Add transaction
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {loadingAccounts ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator colorClassName="accent-primary" />
          </View>
        ) : accountsError ? (
          <View className="flex-1 items-center justify-center px-10">
            <Feather name="alert-circle" size={32} color="red" />

            <Text className="font-brand text-muted-foreground mt-3 text-center text-sm">
              Couldn&apos;t load your accounts.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="px-5 pb-10"
          >
            {/* AI ACTIONS */}

            <View className="mb-4 flex-row gap-2.5">
              <AIActionCard
                icon="camera"
                title="Scan receipt"
                subtitle="Snap a photo"
                colors={AI_GRADIENT}
                onPress={() => setScannerOpen(true)}
              />

              <AIActionCard
                icon="mic"
                title="Voice log"
                subtitle="Just say it"
                colors={AI_GRADIENT_REVERSE}
                onPress={() => setVoiceModalOpen(true)}
              />
            </View>

            {/* TRANSACTION TYPE */}

            <View className="border-border bg-card mb-4 flex-row rounded-xl border p-1">
              {TYPE_OPTIONS.map((option) => {
                const isSelected = type === option.key;

                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      form.setValue("type", option.key);

                      form.setValue(
                        "category",
                        option.key === "INCOME"
                          ? (INCOME_CATEGORIES[0]?.key ?? "food")
                          : (EXPENSE_CATEGORIES[0]?.key ?? "food"),
                      );

                      form.clearErrors(["type", "category"]);
                    }}
                    activeOpacity={0.7}
                    className={cn(
                      "flex-1 items-center rounded-lg py-2.5",
                      isSelected && "bg-primary",
                    )}
                  >
                    <Text
                      className={cn(
                        "font-brand-semibold text-xs",
                        isSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* AMOUNT */}

            <Text className="font-brand-semibold text-foreground mb-1.5 text-xs">
              Amount
            </Text>

            <Controller
              control={form.control}
              name="amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={(value) => {
                    setError("");
                    onChange(value);
                  }}
                  onBlur={onBlur}
                  placeholder="0"
                  placeholderTextColorClassName="accent-muted-foreground"
                  keyboardType="numeric"
                  cursorColorClassName="accent-primary"
                  className="border-border bg-card font-brand text-card-foreground rounded-xl border px-4 py-3.5 text-sm"
                />
              )}
            />

            {form.formState.errors.amount && (
              <Text className="font-brand text-destructive mt-1.5 text-xs">
                {form.formState.errors.amount.message}
              </Text>
            )}

            {/* CATEGORY */}

            <View className="mt-4 mb-4">
              <Text className="font-brand-semibold text-foreground mb-1.5 text-xs">
                Category
              </Text>

              <PillGroup
                options={categories.map((item) => ({
                  key: item.key,
                  label: item.label,
                  icon: item.icon,
                }))}
                value={category}
                onChange={(value) => {
                  form.setValue("category", value);
                  form.clearErrors("category");
                }}
              />

              {form.formState.errors.category && (
                <Text className="font-brand text-destructive mt-1.5 text-xs">
                  {form.formState.errors.category.message}
                </Text>
              )}
            </View>

            {/* ACCOUNT */}

            <View className="mb-4">
              <Text className="font-brand-semibold text-foreground mb-1.5 text-xs">
                Account
              </Text>

              <PillGroup
                options={accounts.map((account) => ({
                  key: account.id,
                  label: account.name,
                }))}
                value={accountId}
                onChange={(value) => {
                  form.setValue("accountId", value);
                  form.clearErrors("accountId");
                }}
              />

              {form.formState.errors.accountId && (
                <Text className="font-brand text-destructive mt-1.5 text-xs">
                  {form.formState.errors.accountId.message}
                </Text>
              )}
            </View>

            {/* DATE */}

            <Text className="font-brand-semibold text-foreground mb-1.5 text-xs">
              Date
            </Text>

            <TouchableOpacity
              onPress={() => setDatePickerOpen((open) => !open)}
              activeOpacity={0.7}
              className={cn(
                "flex-row items-center justify-between rounded-xl border px-4 py-3.5",
                datePickerOpen
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <Text
                className={cn(
                  "font-brand-semibold text-sm",
                  datePickerOpen ? "text-primary" : "text-card-foreground",
                )}
              >
                {formatDate(date, "d MMM yyyy")}
              </Text>

              <Feather
                name="calendar"
                size={17}
                color={datePickerOpen ? "#000000" : "#6B7280"}
              />
            </TouchableOpacity>

            {datePickerOpen ? (
              <View className="border-border bg-card mt-1 mb-4 overflow-hidden rounded-xl border">
                <CalendarPicker
                  value={date}
                  maximumDate={new Date()}
                  onChange={(selectedDate) => {
                    form.setValue("date", selectedDate);
                    setDatePickerOpen(false);
                  }}
                />
              </View>
            ) : (
              <View className="mb-4" />
            )}

            {/* DESCRIPTION */}

            <Text className="font-brand-semibold text-foreground mb-1.5 text-xs">
              Description (optional)
            </Text>

            <Controller
              control={form.control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={(value) => {
                    setError("");
                    onChange(value);
                  }}
                  onBlur={onBlur}
                  placeholder="e.g. Swiggy order"
                  placeholderTextColorClassName="accent-muted-foreground"
                  cursorColorClassName="accent-primary"
                  className="border-border bg-card font-brand text-card-foreground rounded-xl border px-4 py-3.5 text-sm"
                />
              )}
            />

            {/* SERVER ERROR */}

            {error ? (
              <View className="border-destructive/20 bg-destructive/5 mt-3 flex-row items-center gap-2 rounded-xl border px-3.5 py-3">
                <Feather name="alert-circle" size={15} color="red" />

                <Text className="font-brand text-destructive flex-1 text-xs">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* SUBMIT */}

            <TouchableOpacity
              onPress={form.handleSubmit(onSubmit)}
              disabled={saving}
              activeOpacity={0.85}
              className={cn(
                "mt-5 mb-2 items-center rounded-xl py-4",
                saving ? "bg-primary/60" : "bg-primary",
              )}
            >
              <Text className="font-brand-semibold text-primary-foreground text-sm">
                {saving ? "Saving…" : "Save transaction"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {scanning && (
        <View className="bg-secondary absolute inset-0 items-center justify-center">
          <View className="bg-card items-center rounded-2xl px-6 py-5">
            <ActivityIndicator colorClassName="accent-primary" />
            <Text className="text-primary font-brand-semibold mt-3 text-sm">
              Reading receipt…
            </Text>
          </View>
        </View>
      )}

      <ReciptScannerModal
        visible={scannerOpen || params.action === "scan"}
        onClose={() => {
          setScannerOpen(false);
          if (params.action === "scan") {
            router.setParams({ action: undefined });
          }
        }}
        onCaptured={handleReciptCaptured}
      />
      {/* <VoiceRecorderModal
        visible={voiceModalOpen || params.action === "voice"}
        onClose={() => {
          setVoiceModalOpen(false);
          if (params.action==="voice") {
            router.setParams({action:undefined})
          }
        }}
        onCaptured={handleVoiceExtracted}
      /> */}
    </SafeAreaView>
  );
}
