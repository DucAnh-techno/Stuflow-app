// --- login/page.tsx ---
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "src/context/AuthContext";
import { db } from "src/firebase/firebase";
import ReCaptchaV3, { ReCaptchaV3Ref } from "../../src/service/reCaptcha";

/**
 * LoginScreen
 *
 * Layout sections (easy jump):
 *  - Imports
 *  - Local state & refs
 *  - Handlers (handleLoginPress, handleOnToken)
 *  - Render UI (TextInputs, ReCaptcha (conditional), Error text, Submit button)
 *
 * Giữ nguyên logic:
 *  - Nếu user document tồn tại và password khớp -> login local (setUser + AsyncStorage + navigate)
 *  - Nếu không thành công (username ko tồn tại hoặc password sai) -> show ReCaptcha để gọi signIn(username,password,token)
 *
 * Debug helpers:
 *  - Nhiều console.log / console.error để thông tin lỗi rõ ràng
 */

export default function LoginScreen() {
  // --- State & refs ---
  const [focusUsername, setFocusUsername] = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);
  const [isPressed, setIsPressed] = useState(false); // press visual state
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecaptcha, setShowRecaptcha] = useState(false);

  const recaptchaRef = useRef<ReCaptchaV3Ref | null>(null);
  const { setUser, signIn } = useAuth();
  const router = useRouter();

  // If your ReCaptcha page is hosted somewhere else, keep url here
  const RECAPTCHA_URI = "https://ducanh-techno.github.io/reCaptchav3";

  // --- Handlers ---
  const handleLoginPress = async () => {
    // Trim to avoid accidental spaces
    const trimmedUsername = username.trim();
    const trimmedPassword = password;

    setErrorMessage(null);
    setLoading(true);

    if (!trimmedUsername || !trimmedPassword) {
      setErrorMessage("Vui lòng nhập username và password!");
      console.warn("Login attempt with empty username or password.");
      setLoading(false);
      return;
    }

    console.log("Attempt login:", { username: trimmedUsername });

    try {
      // Check local firebase user doc first
      const userDocRef = doc(db, "users", trimmedUsername);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedPassword = data?.password;

        // If password matches the stored one -> local login success
        if (trimmedPassword === storedPassword) {
          try {
            setUser(trimmedUsername);
          } catch (err) {
            console.error("Error in setUser (AuthContext):", err);
          }

          try {
            await AsyncStorage.setItem("user", trimmedUsername);
          } catch (err) {
            console.error("AsyncStorage setItem error:", err);
          }

          console.log("Đăng nhập thành công (firebase local check). Navigating to tabs...");
          router.replace("/(tabs)");
          setLoading(false);
          return;
        }

        // Password mismatch -> show recaptcha fallback (server-side signIn with token)
        console.warn("Password mismatch for user:", trimmedUsername);
        setErrorMessage("Sai password! Thử xác thực ReCaptcha để đăng nhập.");
        setShowRecaptcha(true);
        setLoading(false);
        return;
      } else {
        // Username not found -> show recaptcha fallback
        console.warn("Username not found:", trimmedUsername);
        setErrorMessage("Username không tồn tại. Thử xác thực ReCaptcha để đăng nhập hoặc kiểm tra lại username.");
        setShowRecaptcha(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Lỗi khi truy vấn user từ Firestore:", err);
      setErrorMessage("Lỗi server khi kiểm tra user. Vui lòng thử lại sau.");
      setLoading(false);
      // Optionally show recaptcha as a fallback
      // setShowRecaptcha(true);
    }
  };

  /**
   * handleOnToken
   * - Gọi khi ReCaptcha trả về token
   * - Gọi signIn(username, password, token) theo logic bạn đã có
   */
  const handleOnToken = async (token: string) => {
    console.log("ReCaptcha token nhận được:", token);

    if (!username.trim() || !password) {
      console.error("handleOnToken called but credentials are missing");
      setErrorMessage("Thiếu username hoặc password trước khi xác thực ReCaptcha.");
      setShowRecaptcha(false);
      return;
    }

    setLoading(true);
    try {
      // signIn ở AuthContext của bạn — giữ nguyên interface
      await signIn(username.trim(), password, token);
      console.log("SignIn (server) thành công - setUser + navigate");

      try {
        setUser(username.trim());
      } catch (err) {
        console.error("setUser error after server signIn:", err);
      }

      try {
        await AsyncStorage.setItem("user", username.trim());
      } catch (err) {
        console.error("AsyncStorage setItem error after server signIn:", err);
      }

      setErrorMessage("Đăng nhập lần đầu thành công!");
      setShowRecaptcha(false);
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Lỗi khi signIn bằng token (server):", err);
      // show safe message to user
      setErrorMessage("Xác thực thất bại. Vui lòng thử lại hoặc kiểm tra thông tin.");
      // Keep recaptcha visible so user can retry
      setShowRecaptcha(true);
    } finally {
      setLoading(false);
    }
  };

  // --- Render UI ---
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Username input */}
        <TextInput
          style={[styles.input, { borderColor: focusUsername ? "#000" : "#ddd" }]}
          placeholder="username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          onFocus={() => setFocusUsername(true)}
          onBlur={() => setFocusUsername(false)}
          autoCapitalize="none"
          autoCorrect={false}
          testID="input-username"
          accessibilityLabel="input-username"
        />

        {/* Password input */}
        <TextInput
          style={[styles.input, { borderColor: focusPassword ? "#000" : "#ddd" }]}
          placeholder="password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusPassword(true)}
          onBlur={() => setFocusPassword(false)}
          autoCapitalize="none"
          autoCorrect={false}
          testID="input-password"
          accessibilityLabel="input-password"
        />

        {/* Conditionally show ReCaptcha component (when fallback needed) */}
        {showRecaptcha && (
          <View style={styles.recaptchaWrapper}>
            <ReCaptchaV3 ref={recaptchaRef} uri={RECAPTCHA_URI} onToken={handleOnToken} />
            <Text style={styles.recaptchaHint}>Xác thực ReCaptcha (bắt buộc khi không thể login trực tiếp)</Text>
          </View>
        )}

        {/* Error message */}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submit,
            isPressed ? styles.submitPressed : null,
            loading ? styles.submitDisabled : null,
          ]}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          onPress={handleLoginPress}
          disabled={loading}
          accessibilityLabel="button-login"
          accessibilityState={{ busy: loading }}
        >
          {loading ? (
            // show spinner while loading
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={[styles.submitText, { marginLeft: 8 }]}>Đang xử lý...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {/* Spacer for keyboard / layout on small screens */}
        <View style={{ height: Platform.OS === "ios" ? 120 : 80 }} />
      </View>
    </TouchableWithoutFeedback>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    paddingBottom: 140,
    backgroundColor: "white",
  },
  input: {
    width: "90%",
    borderWidth: 1,
    borderRadius: 16,
    fontFamily: "MuseoModerno",
    fontSize: 22,
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginVertical: 10,
    textAlign: "center",
    color: "#111",
  },
  submit: {
    width: "90%",
    borderRadius: 18,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  submitPressed: {
    backgroundColor: "#eee",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontFamily: "MuseoModerno",
    fontSize: 26,
    textAlign: "center",
  },
  errorText: {
    color: "#cc0000",
    marginTop: 8,
    textAlign: "center",
    width: "90%",
  },
  recaptchaWrapper: {
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  recaptchaHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
