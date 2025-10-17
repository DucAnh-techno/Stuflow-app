// app/(tabs)/schedule/page.tsx
import { createSchedule } from "@/components/functions/schedule/createSchedule";
import { getWeekDayNumbersFrom } from "@/components/functions/schedule/getday";
import { removeSchedule } from "@/components/functions/schedule/removeSchedule";
import { useAuth } from "@/src/context/AuthContext";
import { Schedule } from "@/types";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { Calendar } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { db } from "src/firebase/firebase";
import { moderateScale } from "react-native-size-matters";

/**
 * SchedulePage — cleaned & fixed
 *
 * Sửa chính:
 * - Hooks ở cấp cao nhất (không gọi điều kiện).
 * - Handlers dùng useCallback.
 * - Animated style: đặt opacity trong object style { opacity }.
 * - Kiểm tra user & dữ liệu trước khi gọi API.
 * - Tránh truy cập thuộc tính trên undefined (sử dụng optional chaining).
 * - Chuẩn hóa parseInt(..., 10).
 * - Tối ưu nhỏ: memoize weeks/day list.
 *
 * Giữ nguyên logic: hiển thị tuần, add/remove schedule, popup chi tiết.
 */

const dateNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const { height, width } = Dimensions.get("window");
const months = Array.from({ length: 12 }).map((_, i) => i + 1);

export default function SchedulePage() {
  const [refreshing, setRefreshing] = useState(false);
  const { user, reload, setReload } = useAuth();

  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState<number>(today.getMonth());
  const [year] = useState<number>(today.getFullYear());

  const [isOpen, setIsOpen] = useState(false); // month dropdown open
  const [day, setDay] = useState<string[]>(() => getWeekDayNumbersFrom(new Date()));
  const [date, setDate] = useState<Date>(() => new Date());

  const [scheSelected, setScheSelected] = useState<Schedule | null>(null);
  const [time, setTime] = useState<Date>(new Date());
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [visible, setVisible] = useState(false); // detail modal
  const [showAdd, setShowadd] = useState(false); // add modal
  const [datePickerShow, setDatePickerShow] = useState(false);

  // Animated values (declared once)
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // fetch user schedule
  useEffect(() => {
    let mounted = true;
    async function collectUserData() {
      if (!user) {
        console.warn("SchedulePage: no user, redirecting to login");
        setSchedule([]);
        router.replace("/login/page");
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "users", user));
        if (!mounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          // ensure schedule is array
          setSchedule(Array.isArray(data?.schedule) ? data.schedule : []);
          console.log("SchedulePage: schedule loaded");
        } else {
          console.warn("SchedulePage: user doc not found, redirecting");
          setSchedule([]);
          router.replace("/login/page");
        }
      } catch (err) {
        console.error("collectUserData error:", err);
        setSchedule([]);
      }
    }
    collectUserData();
    return () => {
      mounted = false;
    };
  }, [user, reload]);

  // animate popup open/close
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

  // recompute week days when date or reload changes
  useEffect(() => {
    try {
      const days = getWeekDayNumbersFrom(date);
      setDay(days);
    } catch (err) {
      console.error("Error computing week days from date:", err);
      setDay([]);
    }
  }, [date, reload]);

  // ----- Handlers (useCallback) -----
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const handleSelect = useCallback((m: number) => {
    setMonth(m);
    const newDate = new Date(date);
    newDate.setMonth(m);
    setDate(newDate);
    setIsOpen(false);
  }, [date]);

  const prevWeek = useCallback(() => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 7);
    setDate(newDate);
  }, [date]);

  const nextWeek = useCallback(() => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 7);
    setDate(newDate);
  }, [date]);

  // simple four slots representing 00-06, 06-12, 12-18, 18-24
  const hourSlots = useMemo(() => [1, 2, 3, 4], []);

  const handlePress = useCallback((nativeEvent: { pageX: number; pageY: number }) => {
    const { pageX, pageY } = nativeEvent;
    translateX.setValue(pageX - width / 2);
    translateY.setValue(pageY - height / 2);
    scaleAnim.setValue(0.1);

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
  }, [scaleAnim, translateX, translateY]);

  const handleDatetime = useCallback((nativeEvent: { pageX: number; pageY: number }) => {
    const { pageX, pageY } = nativeEvent;
    translateX.setValue(pageX - width / 3);
    translateY.setValue(pageY - height / 3);
    scaleAnim.setValue(0.1);

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
  }, [scaleAnim, translateX, translateY]);

  const closePopup = useCallback(() => {
    setVisible(false);
    setScheSelected(null);
  }, []);

  const createHandle = useCallback(async () => {
    if (!user) {
      console.error("createHandle: no user in context");
      setError("Bạn chưa đăng nhập");
      return;
    }
    if (!content || content.trim() === "") {
      setError("Hãy nhập nội dung công việc!!!");
      return;
    }

    try {
      await createSchedule(time, user, content);
      setContent("");
      setError("");
      setShowadd(false);
      setReload(new Date());
      console.log("SchedulePage: created schedule");
    } catch (err) {
      console.error("createHandle error:", err);
      setError("Không thể thêm công việc, thử lại sau.");
    }
  }, [content, time, user, setReload]);

  const removeHandle = useCallback(async () => {
    if (!scheSelected) {
      console.warn("removeHandle: no selected schedule");
      return;
    }
    if (!user) {
      console.error("removeHandle: no user");
      return;
    }
    try {
      await removeSchedule(scheSelected, user);
      setVisible(false);
      setScheSelected(null);
      setReload(new Date());
      console.log("SchedulePage: removed schedule");
    } catch (err) {
      console.error("removeHandle error:", err);
    }
  }, [scheSelected, user, setReload]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    try {
      setReload(new Date());
    } catch (err) {
      console.error("onRefresh error:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [setReload]);

  // ----- Derived / memo values -----
  const weeks = useMemo(() => day, [day]); // day already computed via getWeekDayNumbersFrom

  // Safe schedule array already in state; but ensure arrayness
  const safeSchedule = useMemo(() => Array.isArray(schedule) ? schedule : [], [schedule]);

  // ----- Render -----
  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2196F3"]}
          tintColor="#2196F3"
          title="Đang tải..."
          progressBackgroundColor="#fff"
        />
      }
    >
      <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.headeText}>Week Schedule</Text>

              <Pressable
                style={{ position: "absolute", right: 10, borderRadius: 7, backgroundColor: "#ddd", paddingHorizontal: 5 }}
                onPress={(e) => {
                  handlePress(e.nativeEvent);
                  setShowadd(true);
                }}
              >
                <Text style={{ fontFamily: "MuseoModerno", fontSize: 16 }}>Thêm</Text>
              </Pressable>
            </View>

            <View style={{ width: "100%", marginBottom: 15 }}>
              <View style={styles.monthSelector}>
                <TouchableOpacity onPress={prevWeek} style={styles.arrowButton}>
                  <Text style={styles.arrow}>&lt;</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.monthTextWrapper} onPressIn={(e) => { handleDatetime(e.nativeEvent); toggle(); }}>
                  <Text style={styles.monthText}>
                    {weeks?.[0]?.slice(8, 10) ?? "--"}-{weeks?.[6]?.slice(8, 10) ?? "--"}/{weeks?.[0]?.slice(5, 7) ?? "--"}/{weeks?.[0]?.slice(0, 4) ?? year}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={nextWeek} style={styles.arrowButton}>
                  <Text style={styles.arrow}>&gt;</Text>
                </TouchableOpacity>

                {isOpen && (
                  <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
                    <View style={{ flex: 1, position: "absolute", top: 60, left: 10, zIndex: 999 }}>
                      <Animated.View
                        style={[
                          styles.dropdown,
                          { opacity: opacity }, // correct animated opacity usage
                          { transform: [{ scale: scaleAnim }, { translateX: translateX }, { translateY: translateY }] },
                        ]}
                      >
                        {months.map((m, idx) => (
                          <TouchableOpacity key={idx} style={[styles.dropdownItem, idx === month && styles.selectedMonth]} onPress={() => handleSelect(idx)}>
                            <Text style={{ fontFamily: "MuseoModerno" }}>{m}/{year}</Text>
                          </TouchableOpacity>
                        ))}
                      </Animated.View>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Pressable>
                {/* Day Names & grid */}
                <View style={styles.weekHeader}>
                  <View style={[styles.dayCell]}>
                    <View style={{ height: "15%" }}>
                      <Text style={[styles.dayText, { textAlign: "center", marginTop: 20 }]}>Thời gian</Text>
                    </View>
                    <View style={{height: '85%'}}>
                      <View style={[styles.hourcell, { borderTopWidth: 0 }]}><Text style={{fontFamily: 'MuseoModerno', fontWeight: '500'}}>00:00-06:00</Text></View>
                      <View style={styles.hourcell}><Text style={{fontFamily: 'MuseoModerno', fontWeight: '500'}}>06:00-12:00</Text></View>
                      <View style={styles.hourcell}><Text style={{fontFamily: 'MuseoModerno', fontWeight: '500'}}>12:00-18:00</Text></View>
                      <View style={styles.hourcell}><Text style={{fontFamily: 'MuseoModerno', fontWeight: '500'}}>18:00-24:00</Text></View>
                    </View>
                  </View>

                  {dateNames.map((d, s) => {
                    const currentDD = Number(weeks?.[s]?.slice(8, 10));
                    const currentMM = Number(weeks?.[s]?.slice(5, 7));
                    const day = new Date();
                    const ddNow = Number(day.getDate());
                    const mmNow = Number(day.getMonth()) + 1;
                    console.log(ddNow, mmNow);

                    return (
                      <View key={s} 
                      style={[
                        styles.dayCell, styles.verticalBorder,
                        ]}>
                        <View style={[{ height: '15.1%', paddingTop: 15 }, ]}>
                          <Text style={styles.dayText}>{d}</Text>
                          <Text>{weeks?.[s]?.slice(8, 10) ?? "--"}</Text>
                        </View>

                        <View style={[{height: '84.8%'}, currentDD === ddNow && mmNow === currentMM && {backgroundColor: '#e6ffe6'}]}>
                          {hourSlots.map((hour, index) => (
                            <View key={index} style={[styles.mainCell, index === 0 && { borderTopWidth: 0 },]}>
                              <View style={{ width: "100%", flexDirection: "column", flexWrap: "wrap" }}>
                                {safeSchedule.map((item, i) => {
                                  const ddNum = Number(item.daystart?.slice(8, 10));
                                  const mmNum = Number(item.daystart?.slice(5, 7));
                                  // timestart like "13:30": parse hours then divide by 6 (original logic)
                                  const parsedHour = Number(item.timestart?.slice(0, 2));
                                  const timeBlock = !Number.isNaN(parsedHour) ? parsedHour / 6 : -1;

                                  return (
                                    <View key={i} >
                                      {ddNum === currentDD && mmNum === currentMM && timeBlock >= (hour - 1) && timeBlock < hour && (
                                        <Pressable
                                          style={[styles.scheCell, { backgroundColor: item.color ?? "#ccc" }]}
                                          onPress={(e) => { handlePress(e.nativeEvent); setScheSelected(item); setVisible(true); }}
                                        >
                                          <Text style={{ fontFamily: "MuseoModerno", fontSize: 16 }}>{item.timestart}</Text>
                                        </Pressable>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.mainborder} />
              </Pressable>
            </ScrollView>

            

            {/* Detail Modal */}
            <Modal visible={visible} transparent animationType="none">
              <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }} onPress={closePopup}>
                <Animated.View
                  style={{
                    width: 300,
                    minHeight: 180,
                    backgroundColor: scheSelected?.color ?? "white",
                    borderRadius: 12,
                    padding: 30,
                    zIndex: 5,
                    paddingTop: 20,
                    transform: [{ translateX: translateX }, { translateY: translateY }, { scale: scaleAnim }],
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10, fontFamily: "MuseoModerno" }}>Công việc</Text>
                  <Text style={{ fontSize: 16, fontWeight: "500", fontFamily: "MuseoModerno" }}>
                    Ngày: {scheSelected ? `${scheSelected.daystart.slice(8, 10)}-${scheSelected.daystart.slice(5, 7)}-${scheSelected.daystart.slice(0, 4)}` : "--"}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "500", fontFamily: "MuseoModerno" }}>
                    Giờ: {scheSelected?.timestart ?? "--"}
                  </Text>
                  <View style={{ width: '100%', height: 1, backgroundColor: 'grey', alignSelf: 'center', marginVertical: 10 }} />
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "600", fontFamily: "MuseoModerno", width: 85 }}>Nội dung:</Text>
                    <Text style={{ fontSize: 16, fontWeight: "500", fontFamily: "MuseoModerno", backgroundColor: 'white', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, marginTop: 10 }}>
                      {scheSelected?.name ?? "--"}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={removeHandle} style={{ position: "absolute", top: '7%', right: '7%' }}>
                    <View style={{ paddingHorizontal: 12, backgroundColor: "white", borderRadius: 10, paddingVertical: 5 }}>
                      <Text style={{fontFamily: "MuseoModerno", fontWeight: '600'}}>Xóa</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </Pressable>
            </Modal>



            {/* Add Modal */}
            <Modal visible={showAdd} transparent animationType="none">
              <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}
                onPress={() => { setShowadd(false); setError(""); setContent(""); }}
              >
                <Pressable>
                  <Animated.View style={{ width: 300, minHeight: 350, backgroundColor: "white", borderRadius: 12, transform: [{ translateX: translateX }, { translateY: translateY }, { scale: scaleAnim }] }}>
                    <SafeAreaView style={{ flex: 1 }}>
                      <View style={{ padding: 20, flex: 1, justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}>
                        <TouchableOpacity style={{ width: "100%" }} onPress={() => setDatePickerShow(true)}>
                          <View style={styles.selectTimeView}>
                            <Calendar size={32} />
                            <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 5, marginLeft: 20, marginRight: 5 }}>
                              <Text style={{ fontFamily: "MuseoModerno", fontSize: 16 }}>{time ? time.toLocaleDateString() : "No date selected"}</Text>
                            </View>

                            <View style={{ backgroundColor: "#fff", borderRadius: 10, padding: 5 }}>
                              <Text style={{ fontFamily: "MuseoModerno", fontSize: 16 }}>{time ? time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }) : "No date selected"}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        <TextInput style={styles.input} placeholder="Tên công việc..." placeholderTextColor="#ccc" value={content} onChangeText={setContent} />

                        {error !== "" && <Text style={{ fontFamily: "MuseoModerno" }}>{error}</Text>}

                        <TouchableOpacity onPress={createHandle}>
                          <View style={{ height: 50, width: "90%", backgroundColor: "#eee", borderRadius: 10, paddingTop: 7, paddingHorizontal: 10, marginTop: 10 }}>
                            <Text style={{ fontFamily: "MuseoModerno", fontSize: 20, textAlign: "center" }}>Thêm</Text>
                          </View>
                        </TouchableOpacity>

                        <DateTimePickerModal
                          date={time}
                          isVisible={datePickerShow}
                          mode="datetime"
                          is24Hour
                          display="inline"
                          locale="vi"
                          onConfirm={(d) => { setTime(d); setDatePickerShow(false); }}
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
  );
}

/* -------------------------
   Styles
   ------------------------- */
const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: width * 0.035,
    marginTop: 31,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: moderateScale(17),
    paddingHorizontal: width * 0.05,
    height: height * 0.717,
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
    marginTop: 5,
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
    textAlign: "center",
  },
  dropdown: {
    zIndex: 100,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    position: "absolute",
    top: "50%",
    width: 270,
    backgroundColor: "#ddd",
    borderRadius: 8,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownItem: {
    height: 50,
    width: "25%",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectedMonth: {
    backgroundColor: "#9ca3af",
  },
  weekHeader: {
    flexDirection: "row",
    borderColor: "gray",
    height: '100%', 
    minWidth: width * 0.83,
    borderWidth: 1,
    borderRadius: 20,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    height: "100%",

  },
  dayText: {
    fontFamily: "MuseoModerno",
    fontSize: 18,
    fontWeight: "500",
  },
  verticalBorder: {
    borderLeftWidth: 1,
    borderColor: "#9ca3af",
  },
  mainborder: {
    borderWidth: 1,
    height: "85%",
    borderColor: "gray",
    borderRadius: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
    zIndex: -1,
  },
  hourcell: {
    height: `${100 / 4}%`,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: "gray",
  },
  mainCell: {
    height: `25%`,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "gray",
    minWidth: width * (29.7 / 414),
    flexDirection: "column",
    flexWrap: "wrap",
  },
  scheCell: {
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 2,
    marginBottom: 4,
    zIndex: 10,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    zIndex: 100,
  },
  selectTimeView: {
    width: "90%",
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 10,
    textAlign: "center",
  },
  calendarIcon: {
    width: 50,
  },
});
