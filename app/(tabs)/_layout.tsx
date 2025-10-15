// app/(tabs)/_layout.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import * as SplashScreen from "expo-splash-screen";

import { Tabs, router } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { useAuth } from "@/src/context/AuthContext";
import { loginWithPortal } from "@/src/service/authService";
import { updateData } from "@/src/service/updateData";
import { db } from "src/firebase/firebase";
import Sidenav from "../../components/Sidenav";
import ReCaptchaV3, { ReCaptchaV3Ref } from "../../src/service/reCaptcha";
import { moderateScale } from "react-native-size-matters";

/**
 * Layout / Tabs screen
 *
 * Bố cục chính (tìm nhanh):
 *  - Imports
 *  - State & refs (fonts, splash, userData, avatar, recaptcha, uploading)
 *  - Effects:
 *     - Prevent auto hide splash on mount
 *     - Load user data from Firestore
 *     - Hide splash when ready
 *     - Load cached avatar from AsyncStorage
 *  - Handlers:
 *     - handleUpdatePress (show recaptcha)
 *     - handleOnToken (call loginWithPortal -> updateData -> refresh userData)
 *     - handlePickImage (pick avatar & save to Firestore + AsyncStorage)
 *  - Render header area (avatar, user info, update button), Tabs, Sidenav
 *
 * Debug helpers: nhiều console.log / console.error đã được thêm vào cho từng catch/edge-case.
 */

const RECAPTCHA_URI = "https://ducanh-techno.github.io/reCaptchav3";
const { height, width } = Dimensions.get("window");

export default function TabsLayout() {
  // Auth
  const { user, signOut, reload, setReload } = useAuth();

  // Local state
  const [userData, setUserData] = useState<any | null>(null);
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const recaptchaRef = useRef<ReCaptchaV3Ref | null>(null);

  const [avatarUri, setAvatarUri] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  // Fonts
  const [fontsLoaded] = useFonts({
    MuseoModerno: require("../../assets/fonts/MuseoModerno-VariableFont_wght.ttf"),
    MuseoModernoItalic: require("../../assets/fonts/MuseoModerno-Italic-VariableFont_wght.ttf"),
  });

  // Prevent splash auto-hide until we explicitly hide
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch((err) => {
      // safe ignore in case it's already hidden; log for debugging
      console.warn("SplashScreen.preventAutoHideAsync failed:", err);
    });
  }, []);

  // Load cached avatar (if any)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("avatar");
        if (!mounted) return;
        if (raw) {
          // avatar saved as JSON.stringify(uri) in original code
          try {
            const parsed = JSON.parse(raw);
            setAvatarUri(parsed);
          } catch {
            // fallback if not JSON
            setAvatarUri(raw);
          }
        }
      } catch (err) {
        console.error("Error loading avatar from AsyncStorage:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch userData from Firestore when 'user' or reload changes
  useEffect(() => {
    let mounted = true;

    async function collectUserData() {
      if (!user) {
        if (mounted) setUserData(null);
        console.log("No user in context — redirecting to login");
        router.replace("/login/page");
        return;
      }

      try {
        const userDocRef = doc(db, "users", user);
        const docSnap = await getDoc(userDocRef);
        if (!mounted) return;

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.warn("User document not found for:", user);
          setUserData(null);
          router.replace("/login/page");
        }
      } catch (err) {
        console.error("collectUserData error:", err);
        setUserData(null);
      }
    }

    collectUserData();
    return () => {
      mounted = false;
    };
  }, [user, reload]);

  // Hide splash when fonts + initial user state determined
  useEffect(() => {
    const ready = fontsLoaded && user !== undefined;
    if (ready) {
      // small delay may improve user-perceived smoothness
      SplashScreen.hideAsync().catch((err) => {
        console.warn("SplashScreen.hideAsync failed:", err);
      });
    }
  }, [fontsLoaded, user]);

  // If fonts not ready, show a simple loader
  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Đang tải...</Text>
        <Button onPress={signOut} title="Sign Out" />
      </View>
    );
  }

  // If no user (e.g. redirecting), show loader UI
  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Chuyển hướng đến trang đăng nhập...</Text>
      </View>
    );
  }

  /* -------------------------
     Handlers
     ------------------------- */

  const handleUpdatePress = async () => {
    setUploading(true);
    setShowRecaptcha(true);
  };

  /**
   * Called when ReCaptcha returns a token
   * - calls loginWithPortal(user, password, token)
   * - updates server data via updateData
   * - refreshes local Firestore user document
   */
  const handleOnToken = async (recaptchaToken: string) => {
    try {
      console.log("ReCaptcha token received — calling loginWithPortal for user:", user);
      const resData = await loginWithPortal(user!, userData?.password ?? "", recaptchaToken);

      if (!resData?.token) {
        console.warn("loginWithPortal did not return token:", resData);
        throw new Error("No token returned from portal");
      }

      // Update server-side data (as original logic)
      await updateData(user!, userData?.password ?? "", resData.token);

      // Refresh user doc
      const docSnap = await getDoc(doc(db, "users", user!));
      setUserData(docSnap.exists() ? docSnap.data() : null);

      console.log("Update successful after ReCaptcha flow");
    } catch (err) {
      console.error("handleOnToken error:", err);
      Alert.alert("Lỗi", "Không thể cập nhật dữ liệu. Vui lòng thử lại.");
    } finally {
      setShowRecaptcha(false);
      setUploading(false);
      setReload(new Date()); // force re-fetch where needed
    }
  };

  /**
   * Pick an image from library and save avatar to Firestore + AsyncStorage
   */
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện để chọn ảnh.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      // sdk v49+ returns canceled property; handle both shapes
      // @ts-ignore
      if (result.canceled || (result as any).cancelled) {
        console.log("Image selection cancelled by user");
        return;
      }

      // In the modern SDK, result.assets[0].uri exists
      // Fallback: result.uri (old shape)
      // @ts-ignore
      const pickedUri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (!pickedUri) {
        console.warn("Picked image has no URI:", result);
        return;
      }

      // Persist to Firestore (merge) and AsyncStorage
      await setDoc(
        doc(db, "users", user!),
        {
          avatar: pickedUri,
        },
        { merge: true }
      );

      setAvatarUri(pickedUri);
      await AsyncStorage.setItem("avatar", JSON.stringify(pickedUri));
      console.log("Avatar updated:", pickedUri);
    } catch (err) {
      console.error("handlePickImage error:", err);
      Alert.alert("Lỗi", "Không thể chọn hoặc lưu ảnh. Vui lòng thử lại.");
    }
  };

  /* -------------------------
     Render
     ------------------------- */

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={handlePickImage}
          style={{ shadowColor: "#000", shadowRadius: 5, shadowOpacity: 0.4, shadowOffset: { height: 0, width: 0 } }}
        >
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarSkeleton} />
            <Image source={{ uri: avatarUri || userData?.avatar }} style={styles.avatar} />
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          {!userData?.name ? (
            <View>
              <View style={styles.textSkeleton} />
              <View style={[styles.textSkeleton, { height: 15, marginTop: 5 }]} />
            </View>
          ) : (
            <View >
              <Text style={styles.name}>{userData?.name ?? "Họ tên..."}</Text>
              <Text style={styles.mssv}>Mssv: {userData?.username ?? "Mssv..."}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleUpdatePress} style={{ position: "absolute", right: '8%', top: '35%' }}>
          {uploading ? <ActivityIndicator style={styles.spin} /> : <Text style={styles.update}>Stuflow</Text>}
        </TouchableOpacity>

        {showRecaptcha && <ReCaptchaV3 ref={recaptchaRef} uri={RECAPTCHA_URI} onToken={handleOnToken} />}
      </View>

      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
        <Tabs.Screen name="index" />
      </Tabs>

      <Sidenav />
    </View>
  );
}

/* -------------------------
   Styles
   ------------------------- */
const styles = StyleSheet.create({
  container: {
    zIndex: 999,
    height: moderateScale(100),
    width: "100%",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 3,
    elevation: 4,
    transform: [{ translateY: height * 0.04 }],
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  avatarWrapper: {
    width: moderateScale(65),
    height: moderateScale(65),
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: 20,
    marginBottom: 10,
    borderWidth: 0.6,
    borderColor: "white",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarSkeleton: {
    backgroundColor: "#f0f0f0",
    ...StyleSheet.absoluteFillObject,
  },
  userInfo: {
    flex: 1,
    justifyContent: "flex-end",
    marginLeft: 15,
    marginBottom: 12,
    width: 100,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { height: 2, width: 0 },
  },
  name: {
    fontWeight: "600",
    fontSize: moderateScale(16),
    fontFamily: "MuseoModerno",
    marginBottom: -3,
    width: 180,
    lineHeight: 23
  },
  mssv: {
    fontFamily: "MuseoModerno",
    fontSize: moderateScale(10),
    color: "gray",
    width: 180,
  },
  textSkeleton: {
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    height: 25,
    width: 130,
  },
  update: {
    fontWeight: "600",
    fontSize: moderateScale(22),
    fontFamily: "Pacifico",
    color: "#ccc",
    textShadowColor: "#eee",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    paddingVertical: 2,
  },
  spin: {
    transform: [{ scale: 1.3 }],
    width: moderateScale(80),
    height: moderateScale(46),
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
