import { AuthProvider } from "@/src/context/AuthContext";
import { FontProvider } from "@/src/context/FontContext";
import { Slot } from "expo-router";
import { Provider as PaperProvider } from 'react-native-paper';

export default function RootLayout() {

  return (
    <AuthProvider>
      <PaperProvider>
        <FontProvider>
          <Slot />
        </FontProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
