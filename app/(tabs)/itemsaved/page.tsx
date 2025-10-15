// app/(tabs)/document/page.tsx
import { useAuth } from "@/src/context/AuthContext";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import DocumentPage from "../../../components/pages/documentPage";
import PicturePage from "../../../components/pages/picturePage";

/**
 * ItemSaved (Document / Picture tabs)
 *
 * - Giữ nguyên logic: 2 tab (Document, Picture). Mặc định show Document.
 * - Khi `reload` thay đổi (AuthContext), tab Document sẽ được hiển thị (như trước).
 * - Tối ưu: sử dụng useCallback cho handlers, tránh re-render thừa.
 * - Thêm testID / accessibilityLabel để debug / e2e test.
 */

const { height, width } = Dimensions.get("window");

export default function ItemSaved() {
  const { reload, setReload } = useAuth();

  // UI state
  const [refreshing, setRefreshing] = useState(false);
  // Use a single state to represent selected tab for clarity
  const [selectedTab, setSelectedTab] = useState<"document" | "picture">("document");
  const [loadingInitial, setLoadingInitial] = useState(true);

  // When `reload` changes, reset to Document view (keeps previous behavior)
  useEffect(() => {
    console.log("ItemSaved: reload changed -> show Document tab");
    setSelectedTab("document");
    // small UX delay to simulate loading if needed
    setLoadingInitial(false);
  }, [reload]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    try {
      setReload(new Date());
      console.log("ItemSaved: triggered refresh -> setReload");
    } catch (err) {
      console.error("ItemSaved.onRefresh error:", err);
    } finally {
      // keep spinner visible briefly for UX
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [setReload]);

  const showDocument = selectedTab === "document";
  const showPicture = selectedTab === "picture";

  const handleSelectDocument = useCallback(() => {
    setSelectedTab("document");
  }, []);

  const handleSelectPicture = useCallback(() => {
    setSelectedTab("picture");
  }, []);

  // Fallback UI while "initial loading" if you want (kept minimal)
  if (loadingInitial) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ paddingTop: 26 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2196F3"]}
          tintColor="#2196F3"
          title="Đang tải..."
          progressBackgroundColor="#fff"
        />
      }
    >
      <TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={showDocument ? { zIndex: 5 } : { zIndex: 0 }}>
              <Pressable onPress={handleSelectDocument} testID="tab-document" accessibilityLabel="tab-document">
                <View
                  style={[
                    showDocument
                      ? [styles.tabShow, { transform: [{ translateX: 21 }, { translateY: -10 }] }]
                      : [styles.tab, { transform: [{ translateX: -24 }, { translateY: 7 }] }],
                  ]}
                >
                  <Text style={[styles.tabText, showDocument && { opacity: 1, fontSize: 24, paddingTop: 5 }]}>Document</Text>
                </View>
              </Pressable>
            </View>

            <View style={showPicture ? { zIndex: 5 } : { zIndex: 0 }}>
              <Pressable onPress={handleSelectPicture} testID="tab-picture" accessibilityLabel="tab-picture">
                <View
                  style={[
                    showPicture
                      ? [styles.tabShow, { transform: [{ translateX: -21 }, { translateY: -10 }] }]
                      : [styles.tab, { transform: [{ translateX: 24 }, { translateY: 7 }] }],
                  ]}
                >
                  <Text style={[styles.tabText, showPicture && { opacity: 1, fontSize: 24, paddingTop: 5 }]}>Picture</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Render tab contents. Keep both mounted would preserve internal state of child components;
              here we render only the active one (same as original). */}
          <View style={{ zIndex: 10, width: "100%" }}>
            <View style={{display: showPicture ? 'flex' : 'none' }}><PicturePage /></View>
            <View style={{display: showDocument ? 'flex' : 'none' }}><DocumentPage /></View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    paddingTop: 35,
    marginBottom: 90,
  },
  header: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    position: "relative",
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    minHeight: height * 0.73,
  },
  tab: {
    width: (width / 2) - 40,
    height: 25,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginHorizontal: 10,
    alignItems: "center",
  },
  tabShow: {
    width: (width / 2) + 30,
    height: 45,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginHorizontal: -35,
    shadowColor: "#000",
    shadowRadius: 6,
    shadowOpacity: 0.08,
    alignItems: "center",
    marginBottom: -10,
    shadowOffset: { width: 0, height: -5 },
  },
  tabText: {
    fontFamily: "MuseoModerno",
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: "bottom",
    opacity: 0.2,
    textAlign: "center",
    paddingTop: 3,
  },
  loadingWrapper: {
    flex: 1,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
});
