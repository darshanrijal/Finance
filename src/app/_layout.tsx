import { TRPCProvider } from "@/__rpc/react";
import "@/global.css";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <TRPCProvider>
      <Slot />
    </TRPCProvider>
  );
}
