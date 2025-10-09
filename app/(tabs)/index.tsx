//app/(tabs)/Home.tsx
import { useAuth } from '@/src/context/AuthContext';
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { db } from "src/firebase/firebase";

import HomeCalendar from '@/components/HomeCalendar';
import HomeDocument from '@/components/HomeDocument';
import HomePicture from '@/components/HomePicture';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user, reload, setReload, signOut} = useAuth();
  const [ userData, setUserData ] = useState<any | null>(null);
  
  useEffect(() => {
    async function collectUserData() {
      if (!user) return;

      const docSnap = await getDoc(doc(db, "users", user));
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        console.log("reload");
      } else {
        setUserData(null); 
      }
    }
    collectUserData();
  }, [user, reload]);

  const onRefresh = () => {
    setRefreshing(true);

    setReload(new Date());

    setRefreshing(false)
  };


  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{paddingTop: 16}}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2196F3"]}            // màu vòng xoay (Android)
          tintColor="#2196F3"             // màu vòng xoay (iOS)
          title="Đang tải..."             // iOS: chữ hiện khi kéo
          progressBackgroundColor="#fff"  // nền vòng xoay (Android)
        />
      }
    >

      <HomeCalendar userData={userData}></HomeCalendar>
      <HomeDocument userData={userData}></HomeDocument>
      <HomePicture userData={userData}></HomePicture>

      <TouchableOpacity onPress={signOut} style={{width: "100%", alignItems: "center", marginBottom: 130}}>
        <View style={styles.signOut}>
          <Text style={{ fontFamily: "MuseoModerno", fontSize: 20, textAlign: 'center',}}>Sign Out</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
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
  signOut: {
    width: "60%",
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "gray",
    marginTop: 40,
    paddingVertical: 3,
  }
})