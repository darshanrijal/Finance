import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FormSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export default function FormSheetModal({
  children,
  onOpenChange,
  open,
  title,
}: FormSheetModalProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
      className="pb-10"
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="bg-card rounded-t-2xl px-5 pt-5 pb-8">
          <Text className="text-card-foreground mb-4 text-base font-semibold">
            {title}
          </Text>
          <>{children}</>
          <TouchableOpacity
            onPress={() => onOpenChange(false)}
            className="items-center py-2"
          >
            <Text className="text-muted-foreground text-sm">Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
