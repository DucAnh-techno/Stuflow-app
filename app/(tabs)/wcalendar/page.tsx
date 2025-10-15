// app/(tabs)/wcalendar/page.tsx
import { getWeeksDates } from "@/components/functions/getDayOfWeek";
import { useAuth } from "@/src/context/AuthContext";
import { LichTuanItem } from "@/types";
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
 * WeekCalendar (fixed)
 * - All hooks are declared at top-level (no conditional hook calls)
 * - Memoized countsMap and monTrongNgay to avoid repeated filtering
 * - Minor TS fixes: cast dynamic style arrays to any where needed
 */

const dateNamesToShow = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
const dateNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const { height, width } = Dimensions.get("window");
const pageWidth = width * 0.8293;

export default function WeekCalendar() {
  const { user, reload, setReload } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // today / rday stable values
  const today = useMemo(() => new Date(), []);
  const temp = today.getDay(); // 0..6 (Sun..Sat)
  const rday = (temp + 6) % 7; // convert: 0->6 (CN), 1->0 (T2), ..., 6->5 (T7)

  // state
  const [data, setData] = useState<any | null>(null);
  const [isActive, setIsActive] = useState<number>(2 * 10 + rday); // encoded (weekIndex*10 + dayIndex)
  const [day, setDay] = useState<number>(today.getDate());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);

  const scrollRef = useRef<ScrollView | null>(null);

  /* -----------------------
     Hooks: fetch user data
     ----------------------- */
  useEffect(() => {
    let mounted = true;
    async function updateFiles() {
      if (!user) {
        console.warn("WeekCalendar: user missing in context.");
        if (mounted) setData(null);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "users", user));
        if (!mounted) return;

        if (docSnap.exists()) {
          setData(docSnap.data());
          console.log("WeekCalendar: user data loaded.");
        } else {
          console.warn("WeekCalendar: user doc not found for", user);
          setData(null);
        }
      } catch (err) {
        console.error("WeekCalendar: fetch error:", err);
        if (mounted) setData(null);
      }
    }

    updateFiles();
    return () => {
      mounted = false;
    };
  }, [user, reload]);

  /* -----------------------
     Hooks: setup scroll & active index when data/reload changes
     ----------------------- */
  useEffect(() => {
    const doScroll = () => {
      try {
        scrollRef.current?.scrollTo({ x: pageWidth * 2, animated: false });
      } catch (err) {
        console.warn("WeekCalendar: scrollTo failed:", err);
      }
    };

    try {
      (InteractionManager as any).runAfterInteractions(() => {
        doScroll();
      });
    } catch {
      requestAnimationFrame(() => setTimeout(doScroll, 50));
    }

    // reset to center + today
    setIsActive(2 * 10 + rday);
    setDay(new Date().getDate());
    setMonth(new Date().getMonth() + 1);
     
  }, [rday, reload, data]);

  /* -----------------------
     Hooks: Derived / memoized values (UNCONDITIONAL)
     ----------------------- */

  // safe lichTuan array
  const lichTuan = useMemo(() => (Array.isArray(data?.lichTuan) ? (data.lichTuan as LichTuanItem[]) : []), [data]);

  // countsMap to avoid filtering repeatedly when rendering week headers
  const countsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!Array.isArray(lichTuan)) return map;

    for (const mon of lichTuan) {
      const ds = String(mon?.daystart ?? "");
      const dayNum = Number(ds.slice(0, 2));
      const weekdayNum = Number(mon?.thu);
      if (!Number.isFinite(dayNum) || !Number.isFinite(weekdayNum)) continue;
      const key = `${dayNum}-${weekdayNum}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [lichTuan]);

  // classes for currently selected day
  const monTrongNgay = useMemo(() => {
    if (!Array.isArray(lichTuan)) return [];
    const selectedDayIndex = isActive % 10; // 0..6
    const selectedWeekdayNumber = selectedDayIndex + 2; // 2..8
    return lichTuan.filter((mon) => {
      const ds = String(mon?.daystart ?? "");
      const dayNum = Number(ds.slice(0, 2));
      const thuNum = Number(mon?.thu);
      return dayNum === day && thuNum === selectedWeekdayNumber;
    });
  }, [lichTuan, day, isActive]);

  // stable weeks
  const weeks = useMemo(() => getWeeksDates(), []);

  /* -----------------------
     Handlers
     ----------------------- */
  const toggle = useCallback(() => {
    const todayDate = new Date();
    const todayRday = (todayDate.getDay() + 6) % 7;
    setDay(todayDate.getDate());
    setMonth(todayDate.getMonth() + 1);
    setIsActive(2 * 10 + todayRday);
    scrollRef.current?.scrollTo({ x: pageWidth * 2, animated: true });
  }, []);

  const handlePress = useCallback(async (url: string) => {
    try {
      if (!url) {
        console.warn("WeekCalendar: empty url");
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.error("WeekCalendar: cannot open url:", err);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    try {
      setReload(new Date());
    } catch (err) {
      console.error("WeekCalendar: onRefresh error:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [setReload]);

  /* -----------------------
     Conditional UI: skeleton while data not loaded
     (hooks already declared above; safe for ESLint rules)
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
              <Text style={styles.title}>Lịch Tuần</Text>

              <TouchableOpacity onPress={toggle} style={styles.monthTextWrapper}>
                <View style={styles.monthSelector}>
                  <Text style={styles.monthText}>
                    {day}, Tháng {month}
                  </Text>
                  <Text style={styles.dayOfWeekText}>
                    {isActive === 2 * 10 + rday ? "Hôm nay" : dateNamesToShow[isActive % 10]}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Day Names */}
            <ScrollView ref={scrollRef} horizontal snapToInterval={pageWidth} decelerationRate="fast" showsHorizontalScrollIndicator={false}>
              {weeks.map((week, index) => (
                <View key={index} style={styles.weekHeader}>
                  {week.map((d: string, i: number) => {
                    const dayNum = Number(d.slice(0, 2));
                    const weekdayNum = i + 2;
                    const count = countsMap.get(`${dayNum}-${weekdayNum}`) ?? 0;

                    const thisIndexCode = index * 10 + i;
                    const activeMatch = isActive === thisIndexCode;
                    const nextActiveMatch = isActive === (thisIndexCode - 1);

                    // dynamic style assembly (cast to any to satisfy TS)
                    const wrapperStyles: any[] = [styles.weekday];
                    if (i === 6) wrapperStyles.push({ borderRightWidth: 0 });
                    if (i > 0) wrapperStyles.push({ borderLeftWidth: 1 });
                    if (activeMatch && i === 6) wrapperStyles.push(styles.weekAct, { borderRightWidth: 1, borderTopEndRadius: 5, borderTopStartRadius: 5, borderRightColor: "gray" });
                    if (activeMatch && i === 0) wrapperStyles.push(styles.weekAct, { borderRightWidth: 1, borderLeftWidth: 1, borderTopEndRadius: 5, borderTopLeftRadius: 5 });
                    if (activeMatch && i !== 0 && i !== 6) wrapperStyles.push(styles.weekAct, { borderTopStartRadius: 5, borderTopEndRadius: 5, borderRightWidth: 1 });
                    if (nextActiveMatch ) wrapperStyles.push({ borderLeftWidth: 0 });

                    return (
                      <TouchableOpacity
                        key={i}
                        style={wrapperStyles as any}
                        onPress={() => {
                          setIsActive(thisIndexCode);
                          setDay(Number(d.slice(0, 2)));
                          setMonth(Number(d.slice(3, 5)));
                          console.log("Selected index:", thisIndexCode);
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

            {/* Day contents */}
            <View style={styles.subcont}>
              <View style={{ minHeight: height * 0.5, width: "100%", paddingVertical: 10 }}>
                {monTrongNgay.map((mon, index) => {
                  const daystart = String(mon.daystart ?? "");
                  const monDayNum = Number(daystart.slice(0, 2));
                  const monThu = Number(mon.thu);
                  const selectedWeekday = (isActive % 10) + 2;
                  const showThis = monDayNum === day && monThu === selectedWeekday;

                  if (!showThis) return null;

                  return (
                    <View key={index} style={{ width: "100%" }}>
                      <TouchableOpacity onPress={() => handlePress(mon.link)}>
                        <View
                          style={[
                            styles.subItem,
                            mon.isTamNgung && { backgroundColor: "rgba(240,0,0,0.15)", opacity: 0.9 },
                          ]}
                        >
                          <View style={{ flexDirection: "row", alignContent: "space-around", width: "100%" }}>
                            <Text numberOfLines={2} style={{ fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 17, marginBottom: 8, textDecorationLine: "underline", width: width * 0.6 }}>
                              {mon.tenMonHoc}
                            </Text>

                            <Text style={{ fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 12, position: "absolute", right: 0, top: 5 }}>
                              {!mon.isTamNgung ? mon.gioHoc?.slice(0, 5) : "❕"}
                            </Text>
                          </View>

                          <View style={{ flexDirection: "row" }}>
                            <Text style={{ fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14 }}>Phòng: </Text>
                            <Text style={{ fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14, width: width * 0.5 }}>{mon.tenPhong}</Text>
                          </View>

                          <View style={{ flexDirection: "row" }}>
                            <Text style={{ fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14 }}>Thời gian: </Text>
                            <Text style={{ fontFamily: "MuseoModerno", fontWeight: "400", fontSize: 14 }}>{mon.gioHoc} (Tiết {mon.tuTiet}-{mon.denTiet})</Text>
                          </View>

                          {mon.isTamNgung && (
                            <View style={styles.tamNgung}>
                              <Text style={{ fontFamily: "MuseoModerno", fontWeight: "500", fontSize: 14, color: "white", alignSelf: "center" }}>Tạm Ngưng</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>

                      <View style={{ height: 1, backgroundColor: "#ddd", width: "70%", marginLeft: "15%" }} />
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
    position: "relative",
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  subItem: {
    width: "90%",
    minHeight: 100,
    margin: "5%",
    backgroundColor: "#efefef",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    overflow: "hidden",
  },
  tamNgung: {
    position: "absolute",
    top: -20,
    left: "25%",
    height: 30,
    width: 200,
    alignItems: "center",
    justifyContent: "flex-start",
    borderColor: "#9ca3af",
    transform: [{ rotate: "45deg" }, { translateX: 50 }, { translateY: 50 }],
    backgroundColor: "rgba(255,0,0,0.7)",
    paddingTop: 3,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 3,
    minWidth: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,0,0,0.6)",
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
