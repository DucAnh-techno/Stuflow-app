// app/(tabs)/document/page.tsx
import { addSub } from "@/components/functions/addSubject";
import { removePicture } from "@/components/functions/removePicture";
import { removeSubject } from "@/components/functions/removeSubject";
import { savePicture } from "@/components/functions/savePicture";
import { useAuth } from '@/src/context/AuthContext';
import { fileSubSave, Pictures } from "@/types";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { Portal } from 'react-native-paper';
import { db } from "src/firebase/firebase";
import { restorePicture } from "../functions/restoreImg";
import * as FileSystem from 'expo-file-system/legacy';
import { restoreAvatar } from "../functions/restoreAvatar";

const { height, width } = Dimensions.get("window");

export default function PicturePage() {
  const { user, reload } = useAuth();
  const [pictures, setPictures] = useState<fileSubSave[] | []>([]);
  const [ filePick, setFilePick ] = useState<ImagePicker.ImagePickerResult | null>(null);
  const [uri, setUri] = useState<Pictures[]>([]);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [showImage, setShowImage] = useState(false);
  const [ showInput, setShowInput ] = useState(false);

  const [ subjectName, setSubjectName ] = useState("");
  const [ showAddSub, setShowAddSub ] = useState(false);
  const [isLongPressed, setIsLongPress] = useState(false);

  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [insertPic, setInsertPic] = useState(false);
  const [dataRmv, setDataRmv] = useState<{uri: string, subName: string} | null>(null);
  const [pressPosition, setPressPosition] = useState<{ x: number; y: number } | null>(null);

  const [ focus, setFocus ] = useState(false);
  const [ themMon, setThemMon ] = useState(false);

  const [ error, setError ] = useState("");

  const [ avatar, setAvatar ] = useState("");

  useEffect(() => {
    const updateFiles = async () => {
      if (!user) {
        console.error("khong lay duoc user");
        return;
      }

      const docSnap = await getDoc(doc(db, "users", user));
      if (!docSnap.exists()) {
        console.log("lay file that bai");
        return;
      }
      const docData = docSnap.data();
      setPictures(docData.itemSaved || []);
      setAvatar(docData.avatar);
    };

    updateFiles();
  }, [user, reload]);

    const scale = useRef(new Animated.Value(0.6)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const insertScale = useRef(new Animated.Value(0.6)).current;
    const insertOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.stopAnimation();
    scale.stopAnimation();
    if (selected !== undefined) {
      opacity.setValue(0);
      scale.setValue(0.6);
      // show: fade in + scale to 1
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } 
  }, [selected, opacity, scale]);

  useEffect(() => {
    // animation cho insert menu
    insertOpacity.stopAnimation();
    insertScale.stopAnimation();

    if (insertPic) {
        insertOpacity.setValue(0);
        insertScale.setValue(0.6);
        Animated.parallel([
        Animated.timing(insertOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }),
        Animated.spring(insertScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
        }),
        ]).start();
    } else {
        // ẩn mượt
        Animated.parallel([
        Animated.timing(insertOpacity, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
        }),
        Animated.timing(insertScale, {
            toValue: 0.6,
            duration: 120,
            useNativeDriver: true,
        }),
        ]).start();
    }
  }, [insertPic, insertOpacity, insertScale]);

  const pickPicture = async () => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện để chọn ảnh.");
        return;
        }

        const result: ImagePicker.ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,               
        quality: 0.8,             
        base64: false,             
        });
        if (result.canceled) return;

        setFilePick(result);
        setShowInput(true);
    } catch (err) {
      console.error("pickFile error:", err);
      Alert.alert("Lỗi", String((err as Error).message || err));
    }
  };

  const pickCamera = async () => {
    try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần quyền truy cập thư viện để chọn ảnh.");
        return;
        }

        const result: ImagePicker.ImagePickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,                  
        quality: 0.8,             
        base64: false,              
        });
        if (result.canceled) return;

        setFilePick(result);
        setShowInput(true);
    } catch (err) {
      console.error("pickFile error:", err);
      Alert.alert("Lỗi", String((err as Error).message || err));
    }
  };

  const handleAddSub = async () => {
    if (subjectName === "") {
      setError("Vui lòng chọn môn học");
      return;
    } 

    const dest: any = await addSub(subjectName, user);

    setPictures(dest);
    setShowAddSub(false);
    setSubjectName("");
  };

  const handleSavePicture = async () => {
    if(!filePick) {return}
    if (subjectName === "") {
      setError("Vui lòng chọn môn học");
      return;
    } 
    const dest: any = await savePicture(filePick, subjectName, user);

    setPictures(dest);
    setShowInput(false);
    setSubjectName("");
    setInsertPic(false);
    setError("");
  };

  async function removeF( data: {uri: string, subName: string}) {
    if (!data) {console.log('khong co du lieu picture xoa')}
    const {uri, subName} = data;
    const res: any = await removePicture(uri, subName, user);
    setPictures(res);
    setIsLongPress(false);
    setSelected(undefined);
  };

  async function removeSub(subject: string) {
    const res: any = await removeSubject(subject, user);
    setPictures(res);
  };

  function alert(subject: string) {
    Alert.alert(
      "Xác nhận",
      "Bạn cố chắc chắn muốn xóa không",
      [
        { text: "Xóa", onPress: () => removeSub(subject), style: "destructive"},
        { text: "Hủy", style: "cancel"}
      ]
    )
  };

  const handleLongPress = (event: any) => {
    const { pageX, pageY } = event;
    setPressPosition({ x: pageX, y: pageY });  // lưu vị trí nhấn trên màn hình
  };

  const restore = async() => {
    for (const sub of pictures){
      for (const item of sub.pictures) {
        
          try {
            const info = await FileSystem.getInfoAsync(item.uri);

            // Nếu không tồn tại, restore lại
            if (!info.exists) {
              const restored: fileSubSave[] | [] = await restorePicture(
                item.uri,
                sub.subName,
                user
              );
              setPictures(restored);
            }
          } catch (err) {
            console.log("⚠️ Không thể truy cập picture này:", err);
            // fallback: khôi phục lại luôn nếu không thể đọc file
            const restored: fileSubSave[] | [] = await restorePicture(
              item.uri,
              sub.subName,
              user
            );
            setPictures(restored);
          }
      }
    }
  };

  const restoreA = async () => {
    try{
      const info = await FileSystem.getInfoAsync(avatar);

      if(!info.exists) {
        const restore: any = await restoreAvatar(avatar, user);
        setAvatar(restore);
      }
    } catch (err) {
      console.log("⚠️ Không thể truy cập avatar này:", err);
      const info = await FileSystem.getInfoAsync(avatar);

      if(!info.exists) {
        const restore: any = await restoreAvatar(avatar, user);
        setAvatar(restore);
      }
    }
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableWithoutFeedback >
          <View style={styles.container}>
            {(isLongPressed || insertPic) && (
              <Portal>
                <TouchableWithoutFeedback onPress={() => { setIsLongPress(false); setSelected(undefined); setDataRmv(null); setInsertPic(false); }}>
                  <View style={{width: '100%', height: '100%', position: "absolute", top: 0, left: 0, right: 0, bottom: 0, }}>
                    <View style={styles.overlay}></View>
                  </View>
                </TouchableWithoutFeedback>


                { dataRmv && <Animated.View 
                  style={[
                    styles.menu,
                    { transform: [{ scale }], zIndex: 999 },
                    pressPosition && { top: pressPosition.y - 100, left: pressPosition.x - 25 }
                  ]}
                >         
                  <TouchableOpacity onPress={() => removeF(dataRmv!)}>
                    <BlurView intensity={100} tint="light" style={styles.blurRm}>
                      <Text style={styles.remove}>Xóa</Text>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>}

                { insertPic && <Animated.View 
                pointerEvents={insertPic ? "auto" : "none"}
                style={[
                    styles.insertMenu,
                    { transform: [{ scale: insertScale  }], opacity: insertOpacity },
                    insertPic && {zIndex: 999},
                    pressPosition && { top: pressPosition.y - 150, left: pressPosition.x  }
                ]}
                >         
                    <TouchableOpacity onPress={pickCamera}>
                        <BlurView intensity={100} tint="light" style={styles.blurInsert}>
                            <Text style={[styles.insertPic]}>Mở camera</Text>
                        </BlurView>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickPicture}>
                        <BlurView intensity={100} tint="light" style={styles.blurInsert}>
                            <Text style={[styles.insertPic]}>Chọn từ thư viện</Text>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>}

              </Portal>
            )}
            <View style={styles.card}>
              <View style={{width: "100%", alignItems: "flex-end", marginTop: -15}}> 
                <View style={{flexDirection: 'row'}}>
                  <TouchableOpacity 
                  onPress={() => {restore(); restoreA();}}
                  style={{width: 65, transform: [{translateX: -30}, {translateY: 35}], borderWidth: 1, borderRadius: 7, paddingHorizontal: 5, borderColor: "gray"}}>
                      <Text style={{fontWeight: "300", fontSize: 16, textAlign: "right", fontFamily: "MuseoModerno",}}>restore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                  onPress={() => {setShowAddSub(true);}}
                  style={{width: 65, transform: [{translateX: -30}, {translateY: 35}], borderWidth: 1, borderRadius: 7, paddingHorizontal: 5, borderColor: "gray", marginLeft: 10}}>
                      <Text style={{fontWeight: "300", fontSize: 16, textAlign: "right", fontFamily: "MuseoModerno",}}>+ môn</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* List các file */}
              <View style={styles.docCont}>
                {pictures?.map((picture, index) => (
                  <View key={index} style={{minWidth: "95%",}}>
                    <Text style={styles.subText}>{picture.subName}</Text>
                    <TouchableOpacity onPress={() => alert(picture.subName)}>
                      <Text style={[styles.remove, {fontWeight: "300", fontSize: 14, textAlign: "right", marginRight: 20}]}>Xóa môn</Text>
                    </TouchableOpacity>
                    <View style={{flexDirection: "row", flexWrap: "wrap",}}>
                      {picture.pictures.map((item, i) => (
                      <View key={i} style={{ alignItems: "center", width: '30%', margin: `${10 / 6}%` }}>
                        <TouchableOpacity style={{zIndex: 102}} 
                        onPress={() => {setUri(picture.pictures); setShowImage(true); setStartIndex(i); }} 
                        onLongPress={(e) => {
                          setSelected(index * 1000 + i); 
                          setIsLongPress(true);
                          handleLongPress(e.nativeEvent);
                          setDataRmv({uri: item.uri, subName: picture.subName});
                          }}
                          >
                          <View style={[styles.doc, selected === (index * 1000 + i) && styles.selectedFile]}>
                            <Image source={{uri: item.uri }} style={styles.avatar} />
                          </View>
                        </TouchableOpacity>
                      </View>
                      ))}
                  </View>
                </View>
                ))}

                <View style={{ alignItems: "center" }}>
                  <TouchableOpacity onPress={(e) => {setInsertPic(true); handleLongPress(e.nativeEvent);}}>
                    <View style={styles.insert}>
                      <View style={styles.insert2}>
                        <View style={[styles.line, { transform: [{translateY: -15}]}]}></View>
                        <View style={[styles.line, {transform: [{ rotate: "90deg"}, {translateX: -15 }],}]}></View>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Text style={{fontFamily: "MuseoModerno"}}>Insert</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

        {/* Modal fullscreen để hiển thị WebView */}
        <ImageViewing
          images={uri}
          imageIndex={startIndex}            // ảnh mở đầu
          visible={showImage}                  // show/hide modal
          onRequestClose={() => setShowImage(false)} // bắt đóng (Android back, tap close)
          onImageIndexChange={(i) => console.log("swipe to", i)} // optional
          swipeToCloseEnabled={true}         // swipe up/down để đóng
          doubleTapToZoomEnabled={true}      // double tap zoom
        />
 

          {/** Hiển thị input nhập ảnh */}
     <Modal transparent visible={showInput} animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalWrap}>
            <View style={styles.modalBox}>
              <View style={{ marginBottom: 8, marginLeft: 5, flexDirection: "row",  }}>
                <Text style={{fontSize: 16, fontFamily: "MuseoModerno",}}>Chọn môn học:</Text>
                <TouchableOpacity style={styles.themMon} onPress={()=>setThemMon(!themMon)}>
                  <Text style={{fontSize: 14, fontFamily: "MuseoModerno",}}>+ môn</Text>
                </TouchableOpacity>
              </View>
              { !themMon && <Picker
              selectedValue={subjectName}
              onValueChange={(item)=>setSubjectName(item)}
              style={{width: "100%", height: 140, marginTop: -75, overflow: "hidden"}}
              >
                <Picker.Item style={{width: 10, height: 20, fontFamily: "MuseoModerno"}} color="black" label={"Chọn môn..."} value={""}></Picker.Item>
                {pictures.map((f, i) => (
                  <Picker.Item key={i} style={{width: 10, height: 20, fontFamily: "MuseoModerno"}} color="black" label={f.subName} value={f.subName}></Picker.Item>
                ))}
              </Picker>}
              { themMon && <TextInput
                style={[ styles.input, {borderColor: focus ? "#000000" : "#ddd"} ]}
                placeholder="Tên môn..."
                placeholderTextColor="#ccc"
                value={subjectName}
                onChangeText={setSubjectName}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
              />}
              {error !== "" && <Text style={{textAlign: "center", fontFamily: "MuseoModerno", fontSize: 16, color: "red"}}>{error}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => {
                  setShowInput(false); 
                  setSubjectName("");
                  setThemMon(false); setError("");
                  }} 
                  style={styles.cancelBtn}>
                  <Text style={{ color: "black", fontSize: 16, paddingHorizontal: 30 }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePicture} style={styles.saveBtn}>
                  <Text style={{ color: "black", fontSize: 16, paddingHorizontal: 30 }}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>  

      {/**Modal hiển thị thêm môn */}
      <Modal transparent visible={showAddSub} animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalWrap}>
            <View style={styles.modalBox}>
              <View style={{ marginBottom: 8, marginLeft: 5, flexDirection: "row",  }}>
                <Text style={{fontSize: 16, fontFamily: "MuseoModerno",}}>Nhập tên môn học:</Text>
              </View>
              <TextInput
                style={[ styles.input, {borderColor: focus ? "#000000" : "#ddd"} ]}
                placeholder="Tên môn..."
                placeholderTextColor="#ccc"
                value={subjectName}
                onChangeText={setSubjectName}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
              />
              {error !== "" && <Text style={{textAlign: "center", fontFamily: "MuseoModerno", fontSize: 16, color: "red"}}>{error}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => {
                  setShowAddSub(false); 
                  setSubjectName(""); 
                  setError("");
                  setInsertPic(false);
                  }} 
                  style={styles.cancelBtn}>
                  <Text style={{ color: "black", fontSize: 16, paddingHorizontal: 30 }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddSub} style={styles.saveBtn}>
                  <Text style={{ color: "black", fontSize: 16, paddingHorizontal: 30 }}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>  
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    minHeight: height * 0.68
  },
  subText: {
    fontFamily: "MuseoModerno",
    fontSize: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderBottomWidth: 1
  },
  docCont: {
    width: "100%",
    flexDirection: "row",
    padding: 10,
    flexWrap: "wrap",
  },
  doc: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 8,
    backgroundColor: "rgb(240, 240, 240, 0.3)",
    borderColor: "#aaa",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  insert: {
    height: 80,
    width: 80,
    borderRadius: 80,
    margin: 20,
    borderWidth: 1,
    borderColor: "rgba(180,180,180)",
    padding: 4
  },
  insert2: {
    height: 69.5,
    width: 69.5,
    borderRadius: 80,
    backgroundColor: "rgba(230,230,230)",
  },
  line: {
    position: "absolute",
    top: "51%",
    right: "47%",
    height: 30,
    width: 3.5,
    backgroundColor: "rgba(150,150,150)",
    borderRadius: 20,
  },
  // Modal / WebView
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
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
    backgroundColor: "rgba(255,255,255,0.3)", // Insert độ trong suốt
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2.5 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
  blurRm: {
    backgroundColor: "rgb(255,255,255,0.1)", // Insert độ trong suốt
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "gray",
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  closeText: {
    color: "black",
    fontWeight: "600",
    fontSize: 18,
    opacity: 1
  },
  webview: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: "white",
    paddingTop: 20,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    
  },
  modalBox: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    paddingVertical: 30,
    marginBottom: 200
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: "MuseoModerno",
    marginVertical: 6,
    color: "black",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  cancelBtn: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  saveBtn: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 10,
  },
  themMon: {
    position: "absolute", 
    right: 10,
    top: -7,
    backgroundColor: "#ddd", 
    paddingHorizontal: 8, 
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 15,
  },
  remove: {
    fontSize: 16,
    fontFamily: "MuseoModerno"
  },
  insertMenu: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 7,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "gray"
  },
  blurInsert: {
    backgroundColor: "rgb(255,255,255,0.1)", 
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "gray",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 4
  },
  insertPic: {
    fontSize: 16,
    fontFamily: "MuseoModerno",
    width: 130
  },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    zIndex: 100
  },
  selectedFile: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2.5 },
    shadowRadius: 5,
    elevation: 5,
    zIndex: 102,
  },
  menu: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,1)",
    borderRadius: 100,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2.5 },
    shadowRadius: 5,
    elevation: 5,
    zIndex: -1,
  },
  avatar: { 
    width: "100%", 
    height: "100%", 
    resizeMode: "cover" 
  },


});
