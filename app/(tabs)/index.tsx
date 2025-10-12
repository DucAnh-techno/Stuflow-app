// app/(tabs)/index.tsx
/**
 * Home screen (tabs/index)
 *
 * Bố cục chính (tìm nhanh):
 *  - Imports
 *  - Local state & effects (fetch userData, handle refresh)
 *  - Handlers (onRefresh)
 *  - Render (HomeCalendar, HomeDocument, HomePicture, Sign Out)
 *
 * Ghi chú debug:
 *  - Các lỗi truy vấn Firestore được log bằng console.error để dễ kiểm tra trên Metro/Device logs.
 *  - Thêm testID / accessibilityLabel cho một số component để dễ test E2E.
 *
 * Giữ nguyên logic: tải userData từ Firestore dựa trên `user` từ AuthContext; cho phép pull-to-refresh kích hoạt `setReload(new Date())`.
 */

import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { db } from "src/firebase/firebase";

import HomeCalendar from "@/components/HomeCalendar";
import HomeDocument from "@/components/HomeDocument";
import HomePicture from "@/components/HomePicture";

export default function HomeScreen() {
  // state
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { user, reload, setReload, signOut } = useAuth();
  const [userData, setUserData] = useState<any | null>(null);

  // Fetch user data whenever user or reload changes
  useEffect(() => {
    let mounted = true;

    async function collectUserData() {
      if (!user) {
        if (mounted) setUserData(null);
        console.log("No authenticated user. Skipping userData fetch.");
        return;
      }

      try {
        const userDocRef = doc(db, "users", user);
        const docSnap = await getDoc(userDocRef);

        if (!mounted) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          console.log("User data loaded (reload):", user);
        } else {
          console.warn("User document does not exist for:", user);
          setUserData(null);
        }
      } catch (err) {
        console.error("Error fetching userData from Firestore:", err);
        if (mounted) setUserData(null);
      }
    }

    collectUserData();

    return () => {
      mounted = false;
    };
  }, [user, reload]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);

    try {
      // Trigger reload in AuthContext; components listening to `reload` should re-fetch.
      setReload(new Date());
    } catch (err) {
      console.error("onRefresh error:", err);
    } finally {
      // Small delay to ensure RefreshControl shows a spinner on some devices.
      // This is purely UI feedback; adjust duration if desired.
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [setReload]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ paddingTop: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2196F3"]} // Android spinner color
          tintColor="#2196F3" // iOS spinner color
          title="Đang tải..." // iOS: text shown while pulling
          progressBackgroundColor="#fff" // Android background
        />
      }
    >
      {/* Main blocks (keep order) */}
      <HomeCalendar userData={userData} />
      <HomeDocument userData={userData} />
      <HomePicture userData={userData} />

      {/* Sign out button */}
      <TouchableOpacity
        onPress={() => {
          try {
            signOut();
          } catch (err) {
            console.error("Error calling signOut():", err);
          }
        }}
        style={styles.signOutWrapper}
        testID="button-signout"
        accessibilityLabel="button-signout"
      >
        <View style={styles.signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  signOutWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 130,
  },
  signOut: {
    width: "60%",
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "gray",
    marginTop: 40,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontFamily: "MuseoModerno",
    fontSize: 20,
    textAlign: "center",
  },
});
