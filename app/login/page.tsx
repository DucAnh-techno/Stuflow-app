import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAuth } from "src/context/AuthContext";
import { db } from "src/firebase/firebase";
import ReCaptchaV3, { ReCaptchaV3Ref } from '../../src/service/reCaptcha';


export default function LoginScreen() {
  const [ focusU, setFocusU ] = useState(false);
  const [ focusP, setFocusP ] = useState(false);
  const [ submit, setSubmit ] = useState(false);
  const [ loading, setLoading ] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ show, setShow ] = useState(false);
  const { setUser, signIn } = useAuth();
  const router = useRouter();
  const recaptchaRef = useRef<ReCaptchaV3Ref>(null);

  const url = 'https://ducanh-techno.github.io/reCaptchav3';

  const handleLoginPress = async () => {
    setLoading(true);
    if (!username || !password) {
      setError("Vui lòng nhập username | password!");
      setLoading(false);
      return;
    }
    console.log('username:----------', username, 'password-----------------:', password);

    try{
    const docSnap = await getDoc(doc(db, "users", username));
    if (docSnap.exists()) {
      const docPassword = docSnap.data().password;
      if (password === docPassword) {
        setUser(username);
        await AsyncStorage.setItem('user', username);
        console.log('Đăng nhập thành công với firebase!');
        router.replace("/(tabs)");
        return;
      } else {
        setError('Sai password!');
        setLoading(false);
        return;
      }
    } else if (!docSnap.exists()) {
      setError('Sai username!');
      setLoading(false);
      return;
    }

    setShow(true);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu user:", err);
      setError("Lỗi server, vui lòng thử lại!");
      setLoading(false);
    }
  };

  const handleOnToken = async (token: string) => {

    try {
      await signIn(username, password, token);
      console.log('dang nhapj thanh cong');
      setError('Đăng nhập lần đầu thành công!!!');
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Looxi dang nhap Login",error);
    }

    setShow(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, paddingBottom: 140 }}>
        <TextInput 
        style={[ styles.input, {borderColor: focusU ? "#000000" : "#ddd"} ]} 
        placeholder="username" 
        placeholderTextColor="#ccc"
        value={username} 
        onChangeText={setUsername} 
        onFocus={() => setFocusU(true)}
        onBlur={() => setFocusU(false)}
        />
        <TextInput 
        style={[ styles.input, {borderColor: focusP ? "#000000" : "#ddd"} ]} 
        placeholder="password" 
        placeholderTextColor="#ccc"
        secureTextEntry
        value={password} 
        onChangeText={setPassword} 
        onFocus={() => setFocusP(true)}
        onBlur={() => setFocusP(false)}
        />
        { show && <ReCaptchaV3 ref={recaptchaRef} uri={url} onToken={handleOnToken} />}
        {error && <Text>{error}</Text>}
        <Text></Text>
        <TouchableOpacity 
        style={[ styles.submit, {backgroundColor: submit ? "#ccc" : "white"}, loading && { opacity: 0.5 } ]} 
        onPressIn={() => setSubmit(true)}
        onPressOut={() => setSubmit(false)}
        disabled={loading}
        onPress={handleLoginPress}>
          <Text style={{ fontFamily: "MuseoModerno", fontSize: 26, textAlign: 'center',}}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  input: {
    width: "90%",
    borderWidth: 1,
    borderRadius: 16,
    fontFamily: "MuseoModerno", 
    fontSize: 22,
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginVertical: 10,
    textAlign: 'center',
  },
  submit: {
    width: "90%",
    borderRadius: 18,
    paddingVertical: 10,
  }
})