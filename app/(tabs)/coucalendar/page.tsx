import { getWeeksDates } from '@/components/functions/getDayOfWeek';
import { useAuth } from '@/src/context/AuthContext';
import { Courses } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  InteractionManager,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { db } from "src/firebase/firebase";
import SkeletonWeekCard from "../../../components/skeletons/wcalendarSkeleton";

const dateNamesToShow = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const dateNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const eventKey = ["due", "close"];
const { height, width } = Dimensions.get("window");
const pageWidth = width * 0.8293;
const dd = String(new Date().getDate()).padStart(2, "0");
const mm = String(new Date().getMonth() + 1).padStart(2, "0");


export default function CoursesCalendar() {
  const { user, reload } = useAuth();
  const today = new Date();
    
  const [data, setData] = useState<any>();
  const [ isActive, setIsActive ] = useState<number>(0);
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth()+1);
 
  const temp = today.getDay();
  const rday = (temp + 6) % 7;

  const [dateToShow, setDateToShow] = useState<number>(rday);

  const scrollRef = useRef<ScrollView>(null);

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
      setData(docData);
    };

    updateFiles();
  }, [user, reload]);

useEffect(() => {
  const doScroll = () => {
    scrollRef.current?.scrollTo({ x: pageWidth * 2, animated: false });
  };

  try {
    (InteractionManager as any).runAfterInteractions(() => {
      doScroll();
    });
  } catch {
    // fallback an toàn nếu InteractionManager không chấp nhận gọi không có promise
    requestAnimationFrame(() => setTimeout(doScroll, 50));
  }

  setIsActive(parseInt(`${mm}${dd}`));
  setDay(new Date().getDate());
  setMonth(parseInt(mm));
}, [rday, reload, data]);

  if (!data) {
    return (<SkeletonWeekCard></SkeletonWeekCard>);
  }

  const courses = data.courses as Courses[];

  // --- Lọc ra các môn hợp lệ cho ngày đang chọn ---
  const monTrongNgay = (Array.isArray(courses) ? courses : []).filter(
    (course) =>
      parseInt(course.daystart.slice(0, 2)) === day &&
      parseInt(course.daystart.slice(3,5)) === month
  );

  const toggle = () => {
    setDateToShow(rday);
    setDay(parseInt(dd));
    setMonth(parseInt(mm));
    setIsActive(parseInt(`${mm}${dd}`));
    scrollRef.current?.scrollTo({ x: width * 0.83 * 2, animated: true });
  };

  function handlePress(url: string) {
    Linking.openURL(url).catch((err) =>
      console.error("Không thể mở URL: ", err)
    );
  };

  const weeks = getWeeksDates();

  return (
    <ScrollView>
      <TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>E-Learning</Text>
              <TouchableOpacity onPress={toggle} style={styles.monthTextWrapper}>
                <View style={styles.monthSelector}>

                  <Text style={styles.monthText}>{day}, Tháng {month}</Text>
                  
                  <Text style={styles.dayOfWeekText}>{isActive === parseInt(`${mm}${dd}`) ? "Hôm nay" : dateNamesToShow[dateToShow]}</Text>

                </View>
              </TouchableOpacity>
            </View>

            {/* Day Names */}
            <ScrollView 
              ref={scrollRef}
              horizontal
              snapToInterval={pageWidth}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
            >
              {weeks.map((week, index) => (
                <View key={index} style={styles.weekHeader}>
                  {week.map((d, i) => {
                    const count = (Array.isArray(courses) ? courses : []).filter(
                      (course) =>
                        parseInt(course.daystart.slice(0, 2)) === parseInt(d.slice(0, 2)) &&
                        parseInt(course.daystart.slice(3,5)) === parseInt(d.slice(3, 5))
                    ).length;

                    const actived = `${d.slice(3,5)}${d.slice(0,2)}`;

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.weekday,
                          i > 0 && { borderLeftWidth: 1 },
                          isActive === (parseInt(actived) - 1) && { borderLeftWidth: 0 },
                          isActive === parseInt(actived) && i === 6 && [
                            styles.weekAct,
                            { borderRightWidth: 1, borderTopEndRadius: 5, borderTopStartRadius: 5, borderRightColor: "gray" }
                          ],
                          isActive === parseInt(actived) && i === 0 && [
                            styles.weekAct,
                            { borderRightWidth: 1, borderLeftWidth: 1, borderTopEndRadius: 5, borderTopLeftRadius: 5 }
                          ],
                          isActive === parseInt(actived) && i !== 0 && i !== 6 && [
                            styles.weekAct,
                            { borderTopStartRadius: 5, borderTopEndRadius: 5, borderRightWidth: 1 }
                          ],
                        ]}
                        onPress={() => {
                          setIsActive(parseInt(actived));
                          setDay(parseInt(d.slice(0, 2)));
                          setMonth(parseInt(d.slice(3, 5)));
                          setDateToShow(i);
                          console.log(actived);
                        }}
                      >
                        <View style={styles.dayCell}>
                          <Text style={styles.weekText}>{dateNames[i]}</Text>
                          <Text style={styles.dayText}>{d.slice(0, 2)}</Text>

                          {/* Badge hiển thị số môn (hiện khi count > 0) */}
                          {count > 0 && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{count}</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

            </ScrollView>

            <View style={styles.subcont}>
              <View style={{minHeight: height * 0.5, width: "100%", paddingVertical: 10}}>
                {monTrongNgay.map((course, index) => {
                  const coursedisplay = course.coursename?.split(" - ")[1] || "";
                  const date = new Date(parseInt(course.timestart) * 1000);
                  const time = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

                  return (
                  <View key={index} style={{width: "100%"}}>
                    {parseInt(course.daystart.slice(0,2)) === day && parseInt(course.daystart.slice(3,5)) === month &&
                    <View style={{width: "100%"}}>
                      <TouchableOpacity onPress={() => handlePress(course.url)} >
                        <View style={[
                          styles.subItem,
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
                      
                      <View style={{height: 1, backgroundColor: "#ddd", width: "70%", marginLeft: "15%"}}></View>
                    </View>
                    }
                  </View>
                )})}
              </View>
            </View>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: width * 0.035,
    marginTop: 26
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
    
  },
  title: {
    marginLeft: 25,
    paddingBottom: 27,
    fontFamily: "MuseoModerno", 
    fontSize: 22,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  monthSelector: {
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#ddd",
    borderRadius: 8,
    height: 55,
    width: 110,
    marginRight: 15
  },
  monthTextWrapper: {
    paddingHorizontal: 8,
  },
  monthText: {
    fontFamily: "MuseoModerno", 
    fontSize: 14,
    color: "gray",
  },
  dayOfWeekText: {
    fontFamily: "MuseoModerno", 
    fontSize: 20,
    fontWeight: "500"
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
    marginTop: 14,
    width: width * 0.8293,
  },
  weekday: {
    width: "14.28%",
    height: 70,
    borderColor: "gray",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    position: "relative",
  },
  weekAct: {
    backgroundColor: "#eee",
    borderTopWidth: 1, 
    transform: [{translateY: -10}],
    height: 80,
    marginBottom: -5

  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2
  },
  weekText: { 
    fontFamily: "MuseoModerno",  
    fontSize: 20,
    marginBottom: 5,
    fontWeight: "500"
  },
  dayText: {
    fontFamily: "MuseoModerno",  
    fontSize: 12,
    color: "gray"
  },
  subcont: {
    flexDirection: "row",
    width: "100%",
    minHeight: "70%",
    borderWidth: 1,
    borderColor: "gray",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: -6,

  },
  subItem: {
    width: "90%",
    minHeight: 100,
    margin: "5%",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    overflow: "hidden",
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 }, 
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

  /* ---- new styles for vertical lines ---- */
  verticalBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
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

  /* Badge styles */
  badge: {
    position: "absolute",
    top: 4,
    right: 3,
    minWidth: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: "rgb(255,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "MuseoModerno",
    position: "absolute",
    paddingLeft: 0.5
  },
});