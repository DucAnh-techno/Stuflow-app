import { fileSubSave, Pictures } from "@/types";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { restorePicture } from "./functions/restoreImg";
import * as FileSystem from 'expo-file-system';

const { height, width } = Dimensions.get("window");

export default function HomePicture({userData}: {userData: any}) {
  const router = useRouter();
  const [pictures, setPictures] = useState<fileSubSave[] | []>([]);
  const [uri, setUri] = useState<Pictures[]>([]);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (!userData) {return}
    setPictures(userData.itemSaved);
  }, [userData]);

  useEffect(() => {
    const retore = async() => {
      for (const sub of pictures){
        for (const item of sub.pictures) {
          const fileInfo = new FileSystem.File(item.uri);
          const info = fileInfo.info();

          if(!info.exists) {
            const restore: fileSubSave[] | [] = await restorePicture(item.uri, sub.subName, userData.username);
            setPictures(restore);
          }
        }
      }
    };

    retore();
    console.log('restore');
  }, [pictures, userData]);

  const allFile: Pictures[] = pictures.flatMap(sub => sub.pictures.map(pic => ({uri:pic.uri})));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/itemsaved/page")}>
            <Text style={styles.title}>Hình ảnh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/itemsaved/page")}>
            <Text style={styles.allText}>Tất cả</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll ngang grid 2 hàng */}
        <View style={{ width: '90%', overflow: 'hidden', alignSelf: 'center'}}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            <View  style={{minWidth: "95%"}}>
              <View  style={{flexDirection: "row"}}>
                {allFile.map((file, index) => (
                <View key={index} style={{ alignItems: "center" }}>
                  <TouchableOpacity style={{zIndex: 102}} onPress={() => {setUri(allFile); setStartIndex(index); setShowImage(true);}}>
                    <View style={[styles.doc]}>
                      <Image source={{uri: file.uri  }} style={styles.avatar} />
                    </View>
                  </TouchableOpacity>
                </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        <ImageViewing
          images={uri}
          imageIndex={startIndex}            // ảnh mở đầu
          visible={showImage}                  // show/hide modal
          onRequestClose={() => setShowImage(false)} // bắt đóng (Android back, tap close)
          onImageIndexChange={(i) => console.log("swipe to", i)} // optional
          swipeToCloseEnabled={true}         // swipe up/down để đóng
          doubleTapToZoomEnabled={true}      // double tap zoom
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 8,
    paddingBottom: 15
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
