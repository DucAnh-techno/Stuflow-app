import { Courses, DayItem, LichTuanItem } from "@/types";
import { Calendar as CalendarIcon } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { generateCalendar } from "./functions/generatecalendar";

import HomeCalendarSkeleton from "./skeletons/calendarskeleton";

const dateNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const dateNamesToShow = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const months = Array.from({ length: 12 }).map((_, i) => i + 1);
const { height, width } = Dimensions.get("window");

export default function HomeCalendar({userData}: {userData: any}) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>();
  const eventKey = ["due", "close"];
  const rday = today.getDate();
  const rmonth = today.getMonth();

  const [showModal, setShowModal] = useState(false);
  const [timeModal, setTimeModal] = useState("");
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (!userData) {return}
    setData(userData);
  }, [userData])

  if (!data) {
    return (
      <HomeCalendarSkeleton></HomeCalendarSkeleton>
    );
  }

  const courses = data.courses as Courses[];
  const lichTuan = data.lichTuan as LichTuanItem[];
  const lichThang = data.lichThang as DayItem[];

  const toggle = () => setIsOpen(!isOpen);
  const handleSelect = (m: number) => {
    setMonth(m);
    setIsOpen(false);
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 10,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
    });
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  function handlePress(url: string) {
    Linking.openURL(url).catch((err) =>
      console.error("Không thể mở URL: ", err)
    );
  };

  const weeks = generateCalendar(year, month);

  return (
    <>
      <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Lịch học</Text>
              <View style={styles.monthSelector}>
                <TouchableOpacity onPress={prevMonth} style={styles.arrowButton}>
                  <Text style={styles.arrow}>&lt;</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggle} style={styles.monthTextWrapper}>
                  <Text style={styles.monthText}>{month + 1}/{year}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={nextMonth} style={styles.arrowButton}>
                  <Text style={styles.arrow}>&gt;</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.dropdown}>
                    {months.map((m, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.dropdownItem, idx === month && styles.selectedMonth]}
                        onPress={() => handleSelect(idx)}
                      >
                        <Text style={{fontFamily: "MuseoModerno", }}>{m}/{year}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <CalendarIcon size={30} style={{marginRight: 10}} color="black" />
            </View>

            {/* Day Names */}
            <View style={styles.weekHeader}>
              {dateNames.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.dayCell,
                    i > 0 && styles.verticalBorder,         // đường dọc giữa cột
                  ]}
                >
                  <Text style={styles.dayText}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Weeks */}
            {weeks.map((week, wIndex) => (
              <View key={wIndex} style={styles.weekRow}>
                {week.map((day, dIndex) => (
                  <TouchableOpacity 
                    key={dIndex}
                    style={styles.touchToModal}
                    onPress={async () => {
                      if (day !== null) {
                        setShowModal(true);
                        setTimeModal(`${dIndex}-${day}-${month + 1}`);
                        slideAnim.setValue(height);
                        Animated.timing(slideAnim, {
                          toValue: 0,
                          duration: 300,
                          useNativeDriver: true,
                        }).start();
                      }
                    }}
                    >
                    
                    <View
                      style={[
                        styles.dayCellContent,
                        dIndex > 0 && styles.verticalBorder,         // đường dọc giữa cột
                        day != null && Number(day) === rday && month === rmonth  ? { backgroundColor: "#d0d0d0" } : null
                      ]}>
                        
                      <Text style={{fontFamily: "MuseoModerno",}}>{day || ""}</Text>

                      {/* Chấm Blue cho tiết học */}
                      {lichThang.map((item, hIndex) => (
                        <View key={hIndex}>
                          {parseInt(item.date.substring(0, 2), 10) === day && parseInt(item.date.substring(3, 5), 10) === (month + 1) ?
                            <View style={{ flexDirection: "row", }}>
                              {item.subjects.map((sub, i) => (
                                <Text key={i} style={[styles.dot, { color: "black" }]}>&bull;</Text>
                              ))}
                            </View>
                            : null
                          }
                        </View>
                      ))}
                      
                      {/* Chấm Green cho Course bắt đầu */}
                      {courses.map((item, cIndex) => (
                        <View key={cIndex} style={{ flexDirection: "row", }}>
                          {!eventKey.includes(item.eventtype) && parseInt(item.daystart.substring(0, 2), 10) === day && parseInt(item.daystart.substring(3, 5), 10) === (month + 1) ?
                            <Text style={[styles.dot, { color: "rgb(83, 255, 26)" }]}>&bull;</Text>
                            : null
                          }
                        </View>
                      ))}

                      {/* Chấm Red cho Course kết thúc */}
                      {courses.map((item, cIndex) => (
                        <View key={cIndex} style={{ flexDirection: "row", }}>
                          {eventKey.includes(item.eventtype) && parseInt(item.daystart.substring(0, 2), 10) === day && parseInt(item.daystart.substring(3, 5), 10) === (month + 1) ?
                            <Text style={[styles.dot, { color: "red" }]}>&bull;</Text>
                            : null
                          }
                        </View>
                      ))}

                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <Text style={[styles.dot, { color: "black" }]}>&bull;</Text>
                <Text style={{fontFamily: "MuseoModerno", }}>Tiết học</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.dot, { color: "rgb(83, 255, 26)" }]}>&bull;</Text>
                <Text style={{fontFamily: "MuseoModerno", }}>Course bắt đầu</Text>
              </View>
              <View style={styles.legendItem}>
                <Text style={[styles.dot, { color: "red" }]}>&bull;</Text>
                <Text style={{fontFamily: "MuseoModerno", }}>Course kết thúc</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.centeredView}>
        <Modal 
        visible={showModal}
        transparent={true}
        animationType="none"
        >
        <Pressable
          style={styles.overlay}
          onPress={closeModal}
        >
        </Pressable>

        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        ></Animated.View>
          <View style={styles.modalCont}>
            <Text style={{fontFamily: "MuseoModerno", fontSize: 20, fontWeight: "500", textAlign: "center", paddingBottom: 10}}>
              {dateNamesToShow[parseInt(timeModal.slice(0,1))]}, {timeModal.split("-")[1]?.padStart(2, "0")}/{timeModal.split("-")[2]?.padStart(2, "0")}/{year}
            </Text>
            <View style={{height: 1, width: "70%", backgroundColor: "gray", alignSelf: "center"}}></View>
            <View style={styles.modalView}>
              {lichTuan?.map((item, index) => { 
                return(
                  <View key={index}>
                    {timeModal.split("-")[1]?.padStart(2, "0") === item.daystart.slice(0, 2)
                    && timeModal.split("-")[2]?.padStart(2, "0") === item.daystart.slice(3,5)
                    && <View style={{width: "100%"}}>
                        <TouchableOpacity onPress={() => handlePress(item.link)} >
                          <View style={[
                            styles.modalItem, 
                            item.isTamNgung && {backgroundColor: "rgb(240,0,0,0.15)", opacity: 0.7}
                            ]}>
                            <View style={{flexDirection: "row", alignContent: "space-around", width: "100%"}}>
                              <Text style={{fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 17, marginBottom: 8, textDecorationLine: "underline", width: width * 0.6}}>
                                {item.tenMonHoc}
                              </Text>
                              <Text style={{fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 12, position: "absolute", right: 0, top: 5}}>
                                {!item.isTamNgung ? item.gioHoc.slice(0,5)
                                :<View>
                                  <View style={{position: "absolute", height: 21, width: 20, borderRadius:5, backgroundColor: "rgb(255,0,0,0.8)", marginLeft: -0.8, marginTop : -1.8}}></View>
                                  <Text>❕</Text>
                                  </View>}
                                </Text>
                            </View>


                            <View style={{flexDirection: "row"}}>
                              <Text style={{fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14,}}>Phòng: </Text>
                              <Text style={{fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14, width: width * 0.5}}>{item.tenPhong}</Text>
                            </View>

                            <View style={{flexDirection: "row"}}>
                              <Text style={{fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14,}}>Thời gian: </Text>
                              <Text style={{fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14,}}>{item.gioHoc} (Tiết {item.tuTiet}-{item.denTiet})</Text>
                            </View>

                            {item.isTamNgung && <View style={styles.tamNgung}><Text style={{fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14, color: "white", alignSelf: "center"}}>Tạm Ngưng</Text></View>}
                          </View>
                        </TouchableOpacity>
                      </View>
                    }
                  </View>
              )})}

              {courses?.map((course, index) => { 
                const coursedisplay = course.coursename?.split(" - ")[1] || "";
                const date = new Date(parseInt(course.timestart) * 1000);
                const time = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

                return(
                  <View key={index}>
                    {timeModal.split("-")[1]?.padStart(2, "0") === course.daystart.slice(0, 2)
                    && timeModal.split("-")[2]?.padStart(2, "0") === course.daystart.slice(3,5)
                    && <View style={{width: "100%"}}>
                      <TouchableOpacity onPress={() => handlePress(course.url)} >
                        <View style={[
                          styles.modalItem,
                          eventKey.includes(course.eventtype) ? {backgroundColor: "rgb(255,0,0,0.12)", shadowColor: "rgb(255,0,0,0.4)",} : {backgroundColor: "rgb(0,150,0,0.08)", shadowColor: "rgb(0,255,0,0.4)",}
                          ]}>
                          <View style={{flexDirection: "row", alignContent: "space-around", width: "100%"}}>
                            <Text style={{fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 17, marginBottom: 8, textDecorationLine: "underline", width: width * 0.6}}>
                              {coursedisplay}
                            </Text>
                            <Text style={{fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 12, position: "absolute", right: 0, top: 5}}>{time}</Text>
                          </View>

                          <View style={{flexDirection: "row"}}>
                            <Text style={{fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14,}}>Thời gian: </Text>
                            <Text style={{fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14,}}>{time}, ngày {course.daystart}</Text>
                          </View>

                          <View style={{flexDirection: "row"}}>
                            <Text style={{fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14,}}>Hoạt động: </Text>
                            <Text style={{fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14, width: width * 0.5}}>{course.name}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                    }
                  </View>
              )})}
            </View>
          </View>
        </Modal>
      </View>

    </>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)", // làm mờ background khi mở modal
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    height: height,
    width: width,
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalCont: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: -50
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 30,
    marginTop: 5,
  },
  modalItem: {
    minHeight: 100,
    margin: 10,
    backgroundColor: "#efefef",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    overflow: "hidden",
  },
  tamNgung: {
    position: "absolute",
    top: "-55%",
    left: "25%",
    height: 30,
    width: 200,
    alignItems: "center",
    justifyContent: "flex-start",
    borderColor: "#9ca3af",
    transform: [{rotate: "45deg"}, {translateX: "50%"}, {translateY: "50%"}],
    backgroundColor: "rgb(255,0,0,0.7)",
    paddingTop: 3
  },
  container: {
    width: "100%",
    padding: width * 0.035,
    marginTop: 10
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: width * 0.05,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  title: {
    marginLeft: 25,
    fontFamily: "MuseoModerno", 
    fontSize: 22,
    textDecorationLine: "underline",
    width: 90,
    fontWeight: "500",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#d1d5db",
    borderRadius: 8,
    height: 32,
    marginLeft: 40
  },
  arrowButton: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { fontSize: 16, fontWeight: "bold",fontFamily: "MuseoModerno",  },
  monthTextWrapper: {
    paddingHorizontal: 8,
  },
  monthText: {
    fontFamily: "MuseoModerno", 
    fontSize: 14,
  },
  dropdown: {
    zIndex: 100,
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    position: "absolute",
    top: 36,
    left: -80,
    width: 270,
    backgroundColor: "#d1d5db",
    borderRadius: 8,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownItem: {
    height: 50,
    width: '25%',
    alignItems: "center",
    paddingVertical: 10
  },
  selectedMonth: {
    backgroundColor: "#9ca3af",
  },
  weekHeader: {
    flexDirection: "row",
    borderColor: "#9ca3af",
    marginTop: 12,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    width: `${100 / 7}%`
  },
  dayText: { fontFamily: "MuseoModerno",  fontSize: 18, fontWeight: "500" },
  weekRow: {
    flexDirection: "row",
  },
  dayCellContent: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderColor: "#9ca3af",
  },

  /* ---- new styles for vertical lines ---- */
  verticalBorder: {
    borderLeftWidth: 1,
    borderColor: "#9ca3af",
  },

  legend: {
    marginTop: 24,
    marginLeft: 15
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: -2,
  },
  dot: {
    fontSize: 32,
    marginHorizontal: -2,
    marginVertical: -14
  },
  touchToModal: {
    width: `${100 / 7}%`
  }
});
