import { cn } from "@/lib/utils";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export type PillOption<T extends string> = {
  key: T;
  label: string;
  icon?: string;
};

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  scrollable = true,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (key: T) => void;
  scrollable?: boolean;
}) {
  const row = (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const isSelected = value === option.key;

        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onChange(option.key)}
            activeOpacity={0.7}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full border px-3.5 py-2.5",
              isSelected
                ? "border-primary bg-primary"
                : "border-border bg-card",
            )}
          >
            {option.icon && (
              <Text
                className={cn(
                  "text-xs",
                  isSelected
                    ? "text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {option.icon}
              </Text>
            )}

            <Text
              className={cn(
                "font-brand-semibold text-xs",
                isSelected ? "text-primary-foreground" : "text-card-foreground",
              )}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!scrollable) {
    return row;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="pr-4"
    >
      {row}
    </ScrollView>
  );
}
