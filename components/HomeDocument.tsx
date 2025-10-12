import { fileSubSave } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from "react-native";

const { height, width } = Dimensions.get("window");

export default function HomeDocument({userData}: {userData: any}) {
  const router = useRouter();
  const [files, setFiles] = useState<fileSubSave[] | []>([]);

  useEffect(() => {
    if (!userData) {return}
    setFiles(userData.itemSaved);
  }, [userData])

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/itemsaved/page")}>
            <Text style={styles.title}>Tài liệu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/itemsaved/page")}>
            <Text style={styles.allText}>Tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll ngang grid 2 hàng */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
                {files?.map((file, index) => (
                  <View key={index} style={{minWidth: "95%", paddingLeft: 5}}>
                    <View style={{flexDirection: "row"}}>
                      {file.files.map((item, i) => (
                      <View key={i} style={{ alignItems: "center" }}>
                        <TouchableOpacity style={{zIndex: 102}} onPress={() => Linking.openURL(item.uri)}>
                          <View style={[styles.doc, ]}>
                            <Image source={{uri: item.uri  }} style={styles.avatar}></Image>
                          </View>
                        </TouchableOpacity>
                        
                        <Text style={{fontFamily: "MuseoModerno", width: 70, height: 25, textAlign: "center", overflow: "hidden"}}>{item.name}.pdf</Text>
                        
                      </View>
                      ))}
                  </View>
                </View>
                ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 5,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "flex-end",
    marginBottom: 8,
  },
  title: {
    marginLeft: 5,
    fontFamily: "MuseoModerno", 
    fontSize: 20,
    textDecorationLine: "underline",
  },
  allText: {
    fontSize: 11,
    fontWeight: "300",
    textAlign: "right",
    textDecorationLine: "underline",
    paddingBottom: 5
  },
  scrollContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 12,
  },
  docBox: {
    width: 96, // ~6rem
    alignItems: "center",
    marginRight: 12,
    marginBottom: 12,
  },
  docImage: {
    width: 96,
    height: 80, // ~5rem
    backgroundColor: "gray",
    borderRadius: 12,
  },
  docText: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  webview: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: "white",
    paddingTop: 20,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 30,
    height: 40,
    width: 40
  },
  blur: {
    paddingHorizontal: 12,
    paddingVertical: 6,    
    backgroundColor: "rgba(130,130,130,0.3)", // Insert độ trong suốt
    alignItems: "center",
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
  closeText: {
    color: "black",
    fontWeight: "600",
    fontSize: 18,
    opacity: 1
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  doc: {
    height: 80,
    width: 80,
    borderRadius: 8,
    backgroundColor: "rgb(240, 240, 240, 0.3)",
    marginHorizontal: 5,
    borderColor: "#aaa",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  avatar: { 
    width: "100%", 
    height: "100%", 
    resizeMode: "cover" 
  },
});
