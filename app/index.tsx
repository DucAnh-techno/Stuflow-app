// app/index.tsx
import { useAuth } from "@/src/context/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function PageLayout() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
            <Text>Loading...</Text>
        </View>
        );
    }
    
    if (!user) {
        return <Redirect href="/login/page" />;
    }

    return <Redirect href="/(tabs)" />;
}
