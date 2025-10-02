import { AuthProvider } from "@/src/context/AuthContext";
import { FontProvider } from "@/src/context/FontContext";
import { Slot } from "expo-router";

export default function RootLayout() {

  return (
    <AuthProvider>
      <FontProvider>
        <Slot />
      </FontProvider>
    </AuthProvider>
  );
}
