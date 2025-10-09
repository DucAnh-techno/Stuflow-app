import { createSchedule } from '@/components/functions/schedule/createSchedule';
import { getWeekDayNumbersFrom } from '@/components/functions/schedule/getday';
import { useAuth } from '@/src/context/AuthContext';
import { Schedule } from '@/types';
import { router } from 'expo-router';
import { doc, getDoc } from "firebase/firestore";
import { Calendar } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  RefreshControl
} from "react-native";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { db } from "src/firebase/firebase";
import { removeSchedule } from '@/components/functions/schedule/removeSchedule';

const dateNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const { height, width } = Dimensions.get("window");
const months = Array.from({ length: 12 }).map((_, i) => i + 1);


export default function SchedulePage() {
  const [refreshing, setRefreshing] = useState(false);
  const { user, reload, setReload} = useAuth();
  const [ schedule, setSchedule] = useState<Schedule[] | []>([])
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year] = useState(today.getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState<string[] | []>([]);
  const [date,setDate] = useState<Date>(new Date());

  const [scheSelected, setScheSelected] = useState<Schedule | null>(null);
  const [time, setTime] = useState(new Date());
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [visible, setVisible] = useState(false);
  const [showAdd, setShowadd] = useState(false);
  const [datePickerShow, setDatePickerShow] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;


  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    async function collectUserData() {
      if (!user) {
        setSchedule([]);
        router.replace('/login/page');
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "users", user));
        if (!mounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSchedule(data.schedule)
        } else {
          setSchedule([]);
          router.replace("/login/page");
        }
      } catch (err) {
        console.error("collectUserData error:", err);
        setSchedule([]);
      }
    }
    collectUserData();
    return () => { mounted = false; };
  }, [user, reload]);
  
  useEffect(() => {
    opacity.stopAnimation();
    scale.stopAnimation();

    if (isOpen) {
      opacity.setValue(0);
      scale.setValue(0.6);

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
  }, [isOpen, opacity, scale]);

  useEffect(() => {
    setDay(getWeekDayNumbersFrom(date));
  }, [date, reload])


  const toggle = () => setIsOpen(!isOpen);

  const handleSelect = (m: number) => {
    setMonth(m);
    const newDate = new Date(date);
    newDate.setMonth(m);
    setDate(newDate);
    setIsOpen(false);
  };

  const prevWeek = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 7);
    setDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 7);
    setDate(newDate);
  };

  const temp = [1,2,3,4];


  const handlePress = ( nativeEvent: { pageX: number; pageY: number }) => {
    const { pageX, pageY } = nativeEvent;

    // đặt vị trí ban đầu cho animation (tính trung tâm màn hình)
    // translateX, translateY là Animated.Value từ trước
    translateX.setValue(pageX - width / 2);
    translateY.setValue(pageY - height / 2);
    scaleAnim.setValue(0.1);

    // bắt đầu animation phóng to và dịch chuyển vào giữa
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDatetime = ( nativeEvent: { pageX: number; pageY: number }) => {
    const { pageX, pageY } = nativeEvent;

    // đặt vị trí ban đầu cho animation (tính trung tâm màn hình)
    // translateX, translateY là Animated.Value từ trước
    translateX.setValue(pageX - width / 3);
    translateY.setValue(pageY - height / 3);
    scaleAnim.setValue(0.1);

    // bắt đầu animation phóng to và dịch chuyển vào giữa
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePopup = () => {
    setVisible(false);
    setScheSelected(null);
  };

  const createHandle = async () => {
    if (content === "") {setError("Hãy nhập nội dung công việc!!!")}

    await createSchedule(time, user!, content);

    setContent('');
    setError('');
    setShowadd(false);
    setReload(new Date());
  };

  const removeHandle = async() => {
    if (!scheSelected) {console.log('khong tim thay schedule'); return}

    await removeSchedule(scheSelected, user!);

    setVisible(false);
    setScheSelected(null);
    setReload(new Date());
  };

  const onRefresh = () => {
    setRefreshing(true);

    setReload(new Date());

    setRefreshing(false)
  };


    return(
    <ScrollView 
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
      <TouchableWithoutFeedback onPress={() => {setIsOpen(false); }}>
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.headeText}>Week Schedule</Text>
                    <Pressable 
                    style={{position: "absolute", right: 10, borderRadius: 7, backgroundColor: "#ddd", paddingHorizontal: 5}}
                    onPress={(e) => {handlePress(e.nativeEvent); setShowadd(true);}}
                    >
                      <Text style={{fontFamily: "MuseoModerno", fontSize: 16}}>Thêm</Text>
                    </Pressable>
                </View>

                <View style={{width: "100%"}}>
                    <View style={styles.monthSelector}>
                        <TouchableOpacity onPress={prevWeek} style={styles.arrowButton}>
                            <Text style={styles.arrow}>&lt;</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                        
                        style={styles.monthTextWrapper}
                        onPressIn={(e) => {handleDatetime(e.nativeEvent); toggle()}}
                        >
                            <Text style={styles.monthText}>{day[0]?.slice(8,10)}-{day[6]?.slice(8,10)}/{day[0]?.slice(5,7)}/{day[0]?.slice(0,4)}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={nextWeek} style={styles.arrowButton}>
                            <Text style={styles.arrow}>&gt;</Text>
                        </TouchableOpacity>

                        {isOpen && (
                        <Animated.View style={[
                            styles.dropdown,
                            opacity,
                            { transform: [{ scale: scaleAnim }, {translateX}, {translateY}] },
                            ]}>
                            {months.map((m, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.dropdownItem, idx === month && styles.selectedMonth]}
                                onPress={() => handleSelect(idx)}
                            >
                                <Text style={{fontFamily: "MuseoModerno", }}>{m}/{year}</Text>
                            </TouchableOpacity>
                            ))}
                        </Animated.View>
                        )}
                    </View>
                </View>


                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                  <Pressable>
                    {/* Day Names */}
                    <View style={styles.weekHeader}>
                        <View style={[styles.dayCell]}>
                          <View style={{height: "12%", paddingTop: 10}}>
                            <Text style={[styles.dayText, {textAlign: "center"}]}>Thời gian</Text>
                          </View>
                          <View >
                              <View style={[styles.hourcell, {borderTopWidth: 0}]}><Text>00:00-06:00</Text></View>
                              <View style={styles.hourcell}><Text>06:00-12:00</Text></View>
                              <View style={styles.hourcell}><Text>12:00-18:00</Text></View>
                              <View style={styles.hourcell}><Text>18:00-24:00</Text></View>
                          </View>
                        </View>
                      {dateNames?.map((d, s) => {
                        const currentDD = parseInt(day[s]?.slice(8,10));
                        const currentMM = parseInt(day[s]?.slice(5,7));

                        return(
                          <View
                            key={s}
                            style={[
                              styles.dayCell,
                              styles.verticalBorder,   
                            ]}
                          >
                            <TouchableOpacity style={{paddingBottom: 13}}>
                              <Text style={styles.dayText}>{d}</Text>
                              <Text>{day[s]?.slice(8,10)}</Text>
                            </TouchableOpacity>

                            {temp.map((hour, index) => (
                              <View
                              key={index}
                              style={[styles.mainCell, index === 0 && {borderTopWidth: 0}]}
                              > 
                                <View style={{width: "100%", flexDirection: 'column', flexWrap: 'wrap'}}>

                                  {schedule?.map((item, i) => {
                                    const dd = parseInt(item.daystart.slice(8,10));
                                    const mm = parseInt(item.daystart.slice(5,7));
                                    const time = parseInt(item.timestart.slice(0,2)) / 6;

                                    return (
                                    <View key={i}>
                                      {dd === currentDD && mm === currentMM && time >= (hour - 1) && time < (hour) &&
                                        <Pressable 
                                        key={i}
                                        style={[styles.scheCell, {backgroundColor: item.color}]}
                                        onPress={(e) => {handlePress(e.nativeEvent); setScheSelected(item); setVisible(true);}}
                                        >
                                          <Text style={{fontFamily: "MuseoModerno", fontSize: 16}}>{item.timestart}</Text>
                                        </Pressable>
                                      }
                                    </View>
                                  )})}

                                </View>
                              </View>
                            ))}
                          </View>
                      )})}
                    </View>
                    <View style={styles.mainborder}></View>
                  </Pressable>

                </ScrollView>


              <Modal visible={visible} transparent animationType="none">
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={closePopup}
                >
                  <Animated.View
                    style={{
                      width: 250,
                      minHeight: 180,
                      backgroundColor: scheSelected?.color,
                      borderRadius: 12,
                      padding: 20, 
                      zIndex: 5,
                      transform: [
                        { translateX },
                        { translateY },
                        { scale: scaleAnim },
                      ],
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10, fontFamily: "MuseoModerno" }}>Công việc</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500", fontFamily: "MuseoModerno" }}>
                      Ngày:  {scheSelected?.daystart.slice(8,10)}-{scheSelected?.daystart.slice(5,7)}-{scheSelected?.daystart.slice(0,4)}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: "500", fontFamily: "MuseoModerno" }}>
                      Giờ:  {scheSelected?.timestart}                      
                    </Text>
                    <View style={{flexDirection: "row"}}>
                      <Text style={{ fontSize: 16, fontWeight: "600", fontFamily: "MuseoModerno", marginTop: 10, width: 85}}>Nội dung:</Text>
                      <Text style={{ fontSize: 16, fontWeight: "500", fontFamily: "MuseoModerno", marginTop: 10 }}>
                        {scheSelected?.name}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => {removeHandle()}}
                      style={{position: "absolute", top: 10, right: 10, }}
                    >
                      <View style={{padding: 5, backgroundColor: "#eee", borderRadius: 10}}>
                        <Text>Xóa</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </Pressable>
              </Modal>



              <Modal visible={showAdd} transparent animationType="none">
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setShowadd(false);
                    setError('');
                    setContent("");

                  }}
                >
                  <Pressable>
                    <Animated.View
                      style={{
                        width: 300,
                        minHeight: 350,
                        backgroundColor: "white",
                        borderRadius: 12,
                        transform: [
                          { translateX },
                          { translateY },
                          { scale: scaleAnim },
                        ],
                      }}
                    > 
                      <SafeAreaView style={{flex: 1}}>
                        <View style={{padding: 20, flex: 1, display: 'flex', justifyContent: "center", alignItems: "center", width: '100%', height: '100%'}}>
                          <TouchableOpacity
                          style={{width: '100%'}}
                           onPress={() => {setDatePickerShow(true);}} 
                           >
                            <View style={styles.selectTimeView}>
                              <Calendar size={32}></Calendar>
                              <View style={{backgroundColor: "#fff", borderRadius: 10, padding: 5, marginLeft: 20, marginRight: 5 }}>
                                <Text style={{fontFamily: "MuseoModerno", fontSize: 16}}>
                                  {time ? time.toLocaleDateString() : 'No date selected'}
                                </Text>
                              </View>

                              <View style={{backgroundColor: "#fff", borderRadius: 10, padding: 5, }}>
                                <Text style={{fontFamily: "MuseoModerno", fontSize: 16, }}>
                                  {time ? time.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: "2-digit", hour12: false, timeZone: 'Asia/Ho_Chi_Minh'}) : 'No date selected'}
                                </Text>
                              </View>
                              
                            </View>
                          </TouchableOpacity>



                          <TextInput
                            style={styles.input}
                            placeholder="Tên công việc..."
                            placeholderTextColor="#ccc"
                            value={content}
                            onChangeText={setContent}
                          ></TextInput>

                          {!(error === "") &&  <Text style={{fontFamily: "MuseoModerno"}}>{error}</Text>}

                          <TouchableOpacity
                          onPress={() => {createHandle()}}
                          >
                            <View style={{height: 50, width: '90%', backgroundColor: "#eee", borderRadius: 10, paddingTop: 7, paddingHorizontal: 10, marginTop: 10}}>
                              <Text style={{fontFamily: "MuseoModerno", fontSize: 20, textAlign: "center"}}>Thêm</Text>
                            </View>
                            
                          </TouchableOpacity>

                          
                            






                            <DateTimePickerModal
                              date={time}
                              isVisible={datePickerShow}
                              mode="datetime"         
                              is24Hour={true}       
                              display="inline"
                              locale='vi'
                              onConfirm={(date) => { setTime(date); setDatePickerShow(false); }}
                              onCancel={() => { setDatePickerShow(false); }}
                            />
                        </View>
                      </SafeAreaView>
                    </Animated.View>
                  </Pressable>

                </Pressable>
              </Modal>
            </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
    )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: width * 0.035,
    marginTop: 31
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: width * 0.05,
    minHeight: height * 0.73,
  },
  header: {
    alignItems: "center",
  },
  headeText: {
    fontFamily: "MuseoModerno",
    fontSize: 22,
    fontWeight: "500",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#ddd",
    borderRadius: 14,
    height: 50,
    alignSelf: "center",
    width: "85%",
    marginTop: 5
  },
  arrowButton: {
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { 
    fontSize: 28, 
    fontFamily: "MuseoModerno",  
    },
  monthTextWrapper: {
    paddingHorizontal: 8,
    width: "60%",
    
  },
  monthText: {
    fontFamily: "MuseoModerno", 
    fontSize: 18,
    textAlign: "center"
  },
  dropdown: {
    zIndex: 100,
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    position: "absolute",
    top: '110%',
    left: '3%',
    width: 270,
    backgroundColor: "#ddd",
    borderRadius: 8,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownItem: {
    height: 50,
    width: '25%',
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10
  },
  selectedMonth: {
    backgroundColor: "#9ca3af",
  },
  weekHeader: {
    flexDirection: "row",
    borderColor: "gray",
    marginTop: 12,
    height: height * 0.55,
    minWidth: width * 0.83,
    borderWidth: 1,
    borderRadius: 20,    
    overflow: "hidden",
    zIndex: 0,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
    height: "100%",
    paddingHorizontal: 5
  },
  dayText: { 
    fontFamily: "MuseoModerno",  
    fontSize: 18, 
    fontWeight: "500" 
  },
  verticalBorder: {
    borderLeftWidth: 1,
    borderColor: "#9ca3af",
  },
  mainborder: {
    borderWidth: 1,
    height: `${100 -20}%`,
    borderColor: "gray",
    borderRadius: 20,
    position: "absolute",
    bottom: "4.3%",
    width: "100%",
    zIndex: -1
  },
  hourcell: {
    height: `${(93 / 4)}%`,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: "gray",
  },
  mainCell: {
    height: `${(86 / 4)}%`,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "gray",
    minWidth: 20,
    flexDirection: 'column', flexWrap: 'wrap'
  },
  scheCell: {
    padding: 5,
    borderRadius: 5, 
    marginHorizontal: 2,
    marginBottom: 4
  },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    zIndex: 100
  },
  selectTimeView: {
    width: '90%',
    backgroundColor: "#ddd",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",

  },
  input: {
    width: "90%",
    borderWidth: 1,
    borderRadius: 16,
    fontFamily: "MuseoModerno", 
    fontSize: 16,
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginVertical: 10,
    textAlign: 'center',
  },
  calendarIcon: {
    width: 50,

  },
})