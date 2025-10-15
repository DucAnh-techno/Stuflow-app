// app/(tabs)/document/page.tsx
import { addSub } from "@/components/functions/addSubject";
import { removeFile } from "@/components/functions/removefile";
import { removeSubject } from "@/components/functions/removeSubject";
import { saveFile } from "@/components/functions/savefiles";
import { useAuth } from '@/src/context/AuthContext';
import { fileSubSave } from "@/types";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
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
import FileViewer from 'react-native-file-viewer';
import { Portal } from 'react-native-paper';
import { db } from "src/firebase/firebase";
import { restoreFile } from "../functions/restoreFile";

const { height, width } = Dimensions.get("window");

export default function DocumentPage() {
  const { user, reload } = useAuth();
  const [files, setFiles] = useState<fileSubSave[] | []>([]);

  const [ fileName, setFileName ] = useState("");
  const [ subjectName, setSubjectName ] = useState("");
  const [ filePick, setFilePick ] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [ showInput, setShowInput ] = useState(false);
  const [ showAddSub, setShowAddSub ] = useState(false);

  const [isLongPressed, setIsLongPress] = useState(false);
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const [dataRmv, setDataRmv] = useState<{uri: string, subName: string} | null>(null);
  const [pressPosition, setPressPosition] = useState<{ x: number; y: number } | null>(null);


  const [ focus, setFocus ] = useState(false);
  const [ focusD, setFocusD ] = useState(false);
  const [ themMon, setThemMon ] = useState(false);

  const [ error, setError ] = useState("");

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
      setFiles(docData.itemSaved || []);
    };

    updateFiles();
  }, [user, reload]);

  useEffect(() => {
    const retore = async() => {
      for (const sub of files){
        for (const item of sub.files) {
          const fileInfo = new FileSystem.File(item.uri);
          const info = fileInfo.info();

          if(!info.exists) {
            const restore: fileSubSave[] | [] = await restoreFile(item.uri, item.name, sub.subName, user);
            setFiles(restore);
          }
        }
      }
    };

    retore();
    console.log('restore');
  }, [files, user])

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

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

  const pickFile = async () => {
    try {
      if (!user) {return;}

      const result: DocumentPicker.DocumentPickerResult =
        await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });

      if (result.canceled) {return;}

      setFilePick(result);
      setShowInput(true);


    } catch (err) {
      console.error("pickFile error:", err);
      Alert.alert("Lỗi", String((err as Error).message || err));
    }
  };

  const handleSave = async () => {
    if(!filePick) {return}
    if (subjectName === "") {
      setError("Vui lòng chọn môn học");
      return;
    } else if (fileName === "") {
      setError("Vui lòng nhập tên file");
      return;
    }
    const dest: any = await saveFile(filePick, fileName, subjectName, user);

    setFiles(dest);
    setShowInput(false);
    setFileName("");
    setSubjectName("");
  };

  const handleAddSub = async () => {
    if (subjectName === "") {
      setError("Vui lòng chọn môn học");
      return;
    } 
    const dest: any = await addSub(subjectName, user);

    setFiles(dest);
    setShowAddSub(false);
    setSubjectName("");
  };

  async function removeF( data: {uri: string, subName: string}) {
    if (!data) {console.log('khong co du lieu file xoa')}
    const {uri, subName} = data;
    const res: any = await removeFile(uri, subName, user);
    setFiles(res);
    setIsLongPress(false);  
    setSelected(undefined);
    setDataRmv(null);
  };

  async function removeSub(subject: string) {
    const res: any = await removeSubject(subject, user);
    setFiles(res);
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

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            {isLongPressed && (
              <Portal>
                <View style={{ flex: 1 }}>
                  <TouchableWithoutFeedback onPress={() => { setIsLongPress(false); setSelected(undefined); setDataRmv(null);}} >
                    <View style={{width: '100%', height: '100%', position: "absolute", top: 0, left: 0, right: 0, bottom: 0, }}>
                      <View style={styles.overlay}></View>
                    </View>
                  </TouchableWithoutFeedback>
                  
                  <Animated.View 
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
                  </Animated.View>
                </View>
              </Portal>
            )}
            <View style={styles.card}>
              <View style={{width: "100%", alignItems: "flex-end", marginTop: -15}}> 
                <TouchableOpacity 
                onPress={() => {setShowAddSub(true);}}
                style={{width: 65, transform: [{translateX: -30}, {translateY: 35}], borderWidth: 1, borderRadius: 7, paddingHorizontal: 5, borderColor: "gray"}}>
                    <Text style={{fontWeight: "300", fontSize: 16, textAlign: "right", fontFamily: "MuseoModerno",}}>+ môn</Text>
                </TouchableOpacity>
              </View>
              {/* List các file */}
              <View style={styles.docCont}>
                {files?.map((file, index) => (
                  <View key={index} style={{minWidth: "95%",}}>
                    <Text style={styles.subText}>{file.subName}</Text>
                    <TouchableOpacity onPress={() => alert(file.subName)}>
                      <Text style={[styles.remove, {fontWeight: "300", fontSize: 14, textAlign: "right", marginRight: 20}]}>Xóa môn</Text>
                    </TouchableOpacity>
                    <View style={{flexDirection: "row", flexWrap: "wrap",}}>
                      {file.files.map(async(item, i) => {


                        return(
                      <View key={i} style={{ alignItems: "center", }}>
                        <TouchableOpacity style={{zIndex: 102}} onPress={() => {FileViewer.open(item.uri)}} 
                        onLongPress={(e) => {
                          setSelected(index * 1000 + i); 
                          setIsLongPress(true);
                          setDataRmv({uri: item.uri, subName: file.subName});
                          handleLongPress(e.nativeEvent);
                          }}
                          >
                          <View style={[styles.doc, selected === (index * 1000 + i) && styles.selectedFile]}>
                            <Image source={{uri: item.uri  }} style={styles.avatar}></Image>
                          </View>
                        </TouchableOpacity>


                        
                        <Text style={{fontFamily: "MuseoModerno", width: 80, height: 25, textAlign: "center", overflow: "hidden"}}>{item.name}.pdf</Text>
                        
                      </View>
                      )})}
                  </View>
                </View>
                ))}

                <View style={{ alignItems: "center" }}>
                  <TouchableOpacity onPress={pickFile}>
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

      {/* Modal để hiển thị input */}
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
                {files.map((f, i) => (
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
              <TextInput
                style={[ styles.input, {borderColor: focusD ? "#000000" : "#ddd"} ]}
                placeholder="Tên file..."
                placeholderTextColor="#ccc"
                value={fileName}
                onChangeText={setFileName}
                onFocus={() => setFocusD(true)}
                onBlur={() => setFocusD(false)}
              />
              {error !== "" && <Text style={{textAlign: "center", fontFamily: "MuseoModerno", fontSize: 16, color: "red"}}>{error}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => {
                  setShowInput(false); setFileName("unknown"); 
                  setSubjectName(""); setFileName(""); 
                  setThemMon(false); setError("");
                  }} 
                  style={styles.cancelBtn}>
                  <Text style={{ color: "black", fontSize: 16, paddingHorizontal: 30 }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
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
                  setShowInput(false); 
                  setSubjectName(""); 
                  setError("");
                  setShowAddSub(false);
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
    paddingTop: 0
  },
  doc: {
    aspectRatio: 1,
    width: '30%',
    borderRadius: 8,
    backgroundColor: "rgb(240, 240, 240, 0.3)",
    margin: `${10 / 6}%`,
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
  blurRm: {
    backgroundColor: "white", // Insert độ trong suốt
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
