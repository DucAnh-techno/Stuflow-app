// app/(tabs)/coucalendar/page.tsx
import { getWeeksDates } from "@/components/functions/getDayOfWeek";
import { useAuth } from "@/src/context/AuthContext";
import { Courses } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  InteractionManager,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { db } from "src/firebase/firebase";
import SkeletonWeekCard from "../../../components/skeletons/wcalendarSkeleton";
import { moderateScale } from "react-native-size-matters";

/**
 * CoursesCalendar (hooks fixed)
 * - Tất cả hooks (useState/useEffect/useMemo/useCallback) khai báo ở top-level.
 * - Memo hóa countsMap, monTrongNgay, weeks để giảm phép lọc lặp.
 * - Cast dynamic style arrays sang `any` để TypeScript không báo lỗi.
 * - Giữ nguyên logic hiển thị.
 */

const dateNamesToShow = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const dateNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const eventKey = ["due", "close"];
const { height, width } = Dimensions.get("window");
const pageWidth = width * 0.8293;

export default function CoursesCalendar() {
  // Auth + reload
  const { user, reload, setReload } = useAuth();

  // UI state
  const [refreshing, setRefreshing] = useState(false);

  // Today / rday stable values
  const today = useMemo(() => new Date(), []);
  const temp = today.getDay();
  const rday = (temp + 6) % 7;

  // default dd/mm strings for isActive initial value
  const dd = useMemo(() => String(today.getDate()).padStart(2, "0"), [today]);
  const mm = useMemo(() => String(today.getMonth() + 1).padStart(2, "0"), [today]);

  // Data state
  const [data, setData] = useState<any | null>(null);

  // UI selection state (all hooks at top-level)
  const [isActive, setIsActive] = useState<number>(() => parseInt(`${mm}${dd}`, 10));
  const [day, setDay] = useState<number>(() => today.getDate());
  const [month, setMonth] = useState<number>(() => today.getMonth() + 1);
  const [dateToShow, setDateToShow] = useState<number>(() => rday);

  const scrollRef = useRef<ScrollView | null>(null);

  /* -----------------------
     Effects: fetch user data
     ----------------------- */
  useEffect(() => {
    let mounted = true;
    async function updateFiles() {
      if (!user) {
        console.warn("CoursesCalendar: no user in context");
        if (mounted) setData(null);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "users", user));
        if (!mounted) return;
        if (docSnap.exists()) {
          setData(docSnap.data());
          console.log("CoursesCalendar: user data loaded");
        } else {
          console.warn("CoursesCalendar: user doc not found", user);
          setData(null);
        }
      } catch (err) {
        console.error("CoursesCalendar: fetch error", err);
        if (mounted) setData(null);
      }
    }
    updateFiles();
    return () => {
      mounted = false;
    };
  }, [user, reload]);

  /* -----------------------
     Effects: initial scroll & reset on reload/data change
     ----------------------- */
  useEffect(() => {
    const doScroll = () => {
      try {
        scrollRef.current?.scrollTo({ x: pageWidth * 2, animated: false });
      } catch (err) {
        console.warn("CoursesCalendar: scrollTo failed", err);
      }
    };

    try {
      (InteractionManager as any).runAfterInteractions(() => {
        doScroll();
      });
    } catch {
      requestAnimationFrame(() => setTimeout(doScroll, 50));
    }

    // reset to today center
    setIsActive(parseInt(`${mm}${dd}`, 10));
    setDay(new Date().getDate());
    setMonth(parseInt(mm, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rday, reload, data]);

  /* -----------------------
     Derived values (hooks declared unconditionally)
     ----------------------- */

  // Weeks (stable)
  const weeks = useMemo(() => getWeeksDates(), []);

  // Safe cast courses array
  const courses = useMemo(() => (Array.isArray(data?.courses) ? (data.courses as Courses[]) : []), [data]);

  // counts per date key "dd-mm"
  const countsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const course of courses) {
      try {
        const ds = String(course?.daystart ?? "");
        const dnum = parseInt(ds.slice(0, 2), 10);
        const mnum = parseInt(ds.slice(3, 5), 10);
        if (!Number.isFinite(dnum) || !Number.isFinite(mnum)) continue;
        const key = `${dnum}-${mnum}`;
        map.set(key, (map.get(key) ?? 0) + 1);
      } catch (err) {
        console.warn("CoursesCalendar: invalid course entry", course, err);
      }
    }
    return map;
  }, [courses]);

  // courses for currently selected day
  const monTrongNgay = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    return courses.filter((course) => {
      try {
        const ds = String(course.daystart ?? "");
        const dnum = parseInt(ds.slice(0, 2), 10);
        const mnum = parseInt(ds.slice(3, 5), 10);
        return dnum === day && mnum === month;
      } catch {
        return false;
      }
    });
  }, [courses, day, month]);

  /* -----------------------
     Handlers (declared unconditionally)
     ----------------------- */
  const toggle = useCallback(() => {
    setDateToShow(rday);
    setDay(parseInt(dd, 10));
    setMonth(parseInt(mm, 10));
    setIsActive(parseInt(`${mm}${dd}`, 10));
    scrollRef.current?.scrollTo({ x: pageWidth * 2, animated: true });
  }, [rday, dd, mm]);

  const handlePress = useCallback(async (url: string) => {
    try {
      if (!url) {
        console.warn("CoursesCalendar.handlePress: empty url");
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.error("CoursesCalendar: cannot open url", err);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    try {
      setReload(new Date());
    } catch (err) {
      console.error("CoursesCalendar.onRefresh error:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [setReload]);

  /* -----------------------
     Conditional UI: show skeleton while no data
     (BUT hooks already declared above)
     ----------------------- */
  if (!data) {
    return <SkeletonWeekCard />;
  }

  /* -----------------------
     Render
     ----------------------- */
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
      <TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>E-Learning</Text>
              <TouchableOpacity onPress={toggle} style={styles.monthTextWrapper}>
                <View style={styles.monthSelector}>
                  <Text style={styles.monthText}>
                    {day}, Tháng {month}
                  </Text>
                  <Text style={styles.dayOfWeekText}>{isActive === parseInt(`${mm}${dd}`, 10) ? "Hôm nay" : dateNamesToShow[dateToShow]}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Day Names */}
            <ScrollView ref={scrollRef} horizontal snapToInterval={pageWidth} decelerationRate="fast" showsHorizontalScrollIndicator={false}>
              {weeks.map((week, index) => (
                <View key={index} style={styles.weekHeader}>
                  {week.map((d: string, i: number) => {
                    const dayNum = parseInt(d.slice(0, 2), 10);
                    const monthNum = parseInt(d.slice(3, 5), 10);
                    const key = `${dayNum}-${monthNum}`;
                    const count = countsMap.get(key) ?? 0;
                    const actived = `${d.slice(3, 5)}${d.slice(0, 2)}`;
                    const activedNum = parseInt(actived, 10);
                    const thisIndexIsActive = isActive === activedNum;

                    // assemble dynamic styles (cast to any for TS)
                    const wrapperStyles: any[] = [styles.weekday];
                    if (i > 0) wrapperStyles.push({ borderLeftWidth: 1 });
                    if (isActive === activedNum - 1) wrapperStyles.push({ borderLeftWidth: 0 });
                    if (thisIndexIsActive && i === 6) wrapperStyles.push(styles.weekAct, { borderRightWidth: 1, borderTopEndRadius: 5, borderTopStartRadius: 5, borderRightColor: "gray" });
                    if (thisIndexIsActive && i === 0) wrapperStyles.push(styles.weekAct, { borderRightWidth: 1, borderLeftWidth: 1, borderTopEndRadius: 5, borderTopLeftRadius: 5 });
                    if (thisIndexIsActive && i !== 0 && i !== 6) wrapperStyles.push(styles.weekAct, { borderTopStartRadius: 5, borderTopEndRadius: 5, borderRightWidth: 1 });

                    return (
                      <TouchableOpacity
                        key={i}
                        style={wrapperStyles as any}
                        onPress={() => {
                          setIsActive(activedNum);
                          setDay(parseInt(d.slice(0, 2), 10));
                          setMonth(parseInt(d.slice(3, 5), 10));
                          setDateToShow(i);
                          console.log("Selected date code:", activedNum);
                        }}
                      >
                        <View style={styles.dayCell}>
                          <Text style={styles.weekText}>{dateNames[i]}</Text>
                          <Text style={styles.dayText}>{d.slice(0, 2)}</Text>

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

            {/* Content */}
            <View style={styles.subcont}>
              <View style={{ minHeight: height * 0.5, width: "100%", paddingVertical: 10 }}>
                {monTrongNgay.map((course, index) => {
                  const coursedisplay = course.coursename?.split(" - ")[1] || "";
                  const dateObj = new Date(parseInt(course.timestart, 10) * 1000);
                  const time = `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
                  const isEvent = eventKey.includes(course.eventtype);

                  return (
                    <View key={index} style={{ width: "100%" }}>
                      {parseInt(course.daystart.slice(0, 2), 10) === day && parseInt(course.daystart.slice(3, 5), 10) === month && (
                        <View style={{ width: "100%" }}>
                          <TouchableOpacity onPress={() => handlePress(course.url)}>
                            <View style={[
                              styles.subItem,
                              isEvent ? { backgroundColor: "rgba(255,0,0,0.12)", shadowColor: "rgba(255,0,0,0.4)" } : { backgroundColor: "rgba(0,150,0,0.08)", shadowColor: "rgba(0,255,0,0.4)" }
                            ]}>
                              <View style={{ flexDirection: "row", alignContent: "space-around", width: "100%" }}>
                                <Text numberOfLines={2} style={{ fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 17, marginBottom: 8, textDecorationLine: "underline", width: width * 0.6 }}>
                                  {coursedisplay}
                                </Text>
                                <Text style={{ fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 12, position: "absolute", right: 0, top: 5 }}>{time}</Text>
                              </View>

                              <View style={{ flexDirection: "row" }}>
                                <Text style={{ fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14 }}>Thời gian: </Text>
                                <Text style={{ fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14 }}>{time}, ngày {course.daystart}</Text>
                              </View>

                              <View style={{ flexDirection: "row" }}>
                                <Text style={{ fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14 }}>Hoạt động: </Text>
                                <Text style={{ fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14, width: width * 0.5 }}>{course.name}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>

                          <View style={{ height: 1, backgroundColor: "#ddd", width: "70%", marginLeft: "15%" }} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: width * 0.035,
    marginTop: 31,
    marginBottom: 90,
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
    marginLeft: moderateScale(25),
    paddingBottom: (27),
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
    width: moderateScale(110),
    marginRight: 15,
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
    fontWeight: "500",
  },
  dropdown: {
    zIndex: 100,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
    width: "25%",
    alignItems: "center",
    paddingVertical: 10,
  },
  selectedMonth: {
    backgroundColor: "#9ca3af",
  },
  weekHeader: {
    flexDirection: "row",
    marginTop: moderateScale(16),
    width: pageWidth,
  },
  weekday: {
    width: "14.28%",
    height: '100%',
    borderColor: "gray",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  weekAct: {
    backgroundColor: "#eee",
    borderTopWidth: 1,
    transform: [{ translateY: -15 }],
    height: `140%`,
    marginBottom: -5,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 6,
  },
  weekText: {
    fontFamily: "MuseoModerno",
    fontSize: 20,
    marginBottom: 5,
    fontWeight: "500",
  },
  dayText: {
    fontFamily: "MuseoModerno",
    fontSize: 12,
    color: "gray",
  },
  subcont: {
    flexDirection: "row",
    width: "100%",
    minHeight: moderateScale(350),
    borderWidth: 1,
    borderColor: "gray",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  subItem: {
    width: "90%",
    margin: "5%",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    overflow: "hidden",
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    flex: 1
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
    transform: [{ rotate: "45deg" }, { translateX: "50%" }, { translateY: "50%" }],
    backgroundColor: "rgba(255,0,0,0.7)",
    paddingTop: 3,
  },
  verticalBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  legend: {
    marginTop: 24,
    marginLeft: 15,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: -2,
  },
  dot: {
    fontSize: 32,
    marginHorizontal: -2,
    marginVertical: -14,
  },
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
    marginTop: 1,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "MuseoModerno",
    position: "absolute",
    paddingLeft: 0.5,
  },
});
