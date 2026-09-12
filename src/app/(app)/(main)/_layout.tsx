import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useResolveClassNames } from "uniwind";

export default function TabLayout() {
  const cardColor = useResolveClassNames("accent-card").accentColor;
  const mutedColor = useResolveClassNames(
    "accent-muted-foreground",
  ).accentColor;
  const primaryColor = useResolveClassNames("accent-primary").accentColor;
  const primaryLowOpacityColor =
    useResolveClassNames("accent-primary/10").accentColor;

  return (
    <NativeTabs
      iconColor={mutedColor}
      tintColor={primaryColor}
      rippleColor="transparent"
      indicatorColor={primaryLowOpacityColor}
      backgroundColor={cardColor}
      labelVisibilityMode="selected"
      labelStyle={{
        fontFamily: "Inter_600SemiBold",
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label>Transactions</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{
            default: "arrow.left.arrow.right",
            selected: "arrow.left.arrow.right.circle.fill",
          }}
          md={{
            default: "swap_horiz",
            selected: "swap_horiz",
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="add-transaction">
        <NativeTabs.Trigger.Label>Add</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
          md={{ default: "add_circle_outline", selected: "add_circle" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="assistant">
        <NativeTabs.Trigger.Label>Assistant</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "sparkles", selected: "sparkles" }}
          md={{ default: "auto_awesome", selected: "auto_awesome" }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md={{ default: "person_outline", selected: "person" }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
