// app/(tabs)/index.tsx
import { useAuth } from "@/src/context/AuthContext";
import { loginWithPortal } from "@/src/service/authService";
import { updateData } from "@/src/service/updateData";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import { router, Tabs } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { db } from "src/firebase/firebase";
import Sidenav from "../../components/Sidenav";
import ReCaptchaV3, { ReCaptchaV3Ref } from '../../src/service/reCaptcha';


const url = 'https://ducanh-techno.github.io/reCaptchav3';

export default function TabScreen() {
  const { user, signOut, reload, setReload } = useAuth();
  const [userData, setUserData] = useState<any | null>(null);
  const [ show, setShow ] = useState(false);
  const recaptchaRef = useRef<ReCaptchaV3Ref>(null);

  const [avatarUrl, setAvatarUrl] = useState("");

  const [uploading, setUpLoading] = useState(false);

  // load fonts
  const [fontsLoaded] = useFonts({
    MuseoModerno: require("../../assets/fonts/MuseoModerno-VariableFont_wght.ttf"),
    MuseoModernoItalic: require("../../assets/fonts/MuseoModerno-Italic-VariableFont_wght.ttf"),
  });

  // prevent auto hide once on mount (optional)
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
  }, []);

  // fetch userData with error handling
  useEffect(() => {
    let mounted = true;
    async function collectUserData() {
      if (!user) {
        setUserData(null);
        router.replace('/login/page');
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "users", user));
        if (!mounted) return;
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null);
          router.replace("/login/page");
        }
      } catch (err) {
        console.error("collectUserData error:", err);
        setUserData(null);
      }
    }
    collectUserData();
    return () => { mounted = false; };
  }, [user, reload]);

  // hide splash only when everything is ready (fontsLoaded and userData loaded or known)
  useEffect(() => {
    const ready = fontsLoaded && (user !== undefined) && (user ? true : true); // you can refine condition
    if (ready) {
      // small delay optional to avoid flicker
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, user, userData]);

  // show loading indicator while fonts or userData are loading
  if (!fontsLoaded ) {
    return (
      <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
        <ActivityIndicator size="large" />
        <Text>Đang tải...</Text>
        <Button onPress={signOut}title="Sign Out"></Button>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{flex:1,justifyContent:"center",alignItems:"center"}}>
        <ActivityIndicator size="large" />
        <Text>Chuyển hướng đến trang đăng nhập...</Text>
      </View>
    );
  }

  const handleUpdatePress = async () => {
    setUpLoading(true);
    setShow(true);
  };

  const handleOnToken = async (recaptchaToken: string) => {
    try {
      const resData = await loginWithPortal(user, userData?.password ?? '', recaptchaToken);
      
      await updateData(user, userData.password, resData.token);
      const docSnap = await getDoc(doc(db, "users", user));
      setUserData(docSnap.exists() ? docSnap.data() : null);
      console.log('update thành công');
    } catch (err) {
      console.error("handleOnToken error:", err);
    }
    setShow(false);
    setUpLoading(false);
    const now = new Date();
    setReload(now);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện để chọn ảnh.");
      return;
    }

    const result: ImagePicker.ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,        // cho chỉnh crop nhỏ (true/false)
      aspect: [4, 3],             // nếu allowsEditing true, giới hạn tỉ lệ
      quality: 0.8,               // 0..1
      base64: false,              // true nếu cần base64
    });
    if (result.canceled) return;

    await setDoc(doc(db, "users", user), {
        avatar: result.assets[0].uri,
    }, { merge: true});

    setAvatarUrl(result.assets[0].uri);
    await AsyncStorage.setItem('avatar', JSON.stringify(result.assets[0].uri));

  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View style={styles.container}>
        <TouchableOpacity onPress={handlePickImage} style={{shadowColor: "#000", shadowRadius: 5, shadowOpacity: 0.4, shadowOffset: {height: 0, width: 0},}}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarSkeleton}></View>
            <Image source={{uri: avatarUrl || userData?.avatar}} style={styles.avatar} />
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          {!userData?.name  
          ?<View>
              <View style={styles.textSkeleton}></View>
              <View style={[styles.textSkeleton, {height: 15, marginTop: 5}]}></View>
            </View>
            : <View>
                <Text style={styles.name}>{userData?.name ?? 'Họ tên...' }</Text>
                <Text style={styles.mssv}>Mssv: {userData?.username ?? 'Mssv...'}</Text>
              </View>
            }
        </View>

        <TouchableOpacity
        onPress={handleUpdatePress}
        style={{ position: "absolute", right: 10}}
        >
          { uploading ? 
          <ActivityIndicator style={styles.spin}></ActivityIndicator> 
          :<Text style={styles.update}>Stuflow</Text>}
        </TouchableOpacity>

        {show && <ReCaptchaV3 ref={recaptchaRef} uri={url} onToken={handleOnToken} />}
      </View>
      
      <Tabs screenOptions={{headerShown: false, tabBarStyle: {display: "none"},}}>
        <Tabs.Screen name="index" />
      </Tabs>


      <Sidenav />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    zIndex: 999,
    height: 100, 
    width: "100%", 
    backgroundColor: "white", 
    flexDirection: "row", 
    alignItems: "flex-end", 
    paddingBottom: 5, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 2.5 }, 
    shadowRadius: 3, 
    elevation: 4,
    transform: [{translateY: 32}],
    borderTopRightRadius: 20, 
    borderTopLeftRadius: 20, 
  },
  avatarWrapper: { 
    width: 70, 
    height: 70, 
    borderRadius: 20, 
    overflow: "hidden", 
    marginLeft: 20, 
    marginBottom: 10,
    borderWidth: 0.6,
    borderColor: "white"
  },
  avatar: { 
    width: "100%", 
    height: "100%", 
    resizeMode: "cover" 
  },
  avatarSkeleton: {
    backgroundColor: "#f0f0f0",
    ...StyleSheet.absoluteFillObject,
  },
  userInfo: { 
    flex: 1, 
    justifyContent: "flex-end", 
    marginLeft: 15, 
    marginBottom: 15,
    width: 100,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: {height: 2, width: 0},
  },
  name: { 
    fontWeight: "600", 
    fontSize: 18,
    fontFamily: "MuseoModerno", 
    marginBottom: -3,
  },
  mssv: { 
    fontFamily: "MuseoModerno",
    fontSize: 11, 
    color: "gray" 
  },
  textSkeleton: {
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    height: 25,
    width: 130,
  },
  update: {
    fontWeight: "600", 
    fontSize: 22,
    fontFamily: "Pacifico", 
    marginBottom: 25,
    marginRight: 50,
    color: "#ccc",
    textShadowColor: "#eee",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    paddingVertical: 2,
  },
  spin: {
    marginBottom: 30,
    marginRight: 70,
    transform: [{ scale: 1.3 }],
  }
});
