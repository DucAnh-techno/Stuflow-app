import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { generateCalendar } from "../functions/generatecalendar";


const dateNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function HomeCalendarSkeleton() {
  const today = new Date();
  const [month] = useState(today.getMonth());
  const [year] = useState(today.getFullYear());



  const weeks = generateCalendar(year, month);

  return (
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.title}></View>
            <View style={styles.monthSelector}></View>
            <View style={styles.icon}></View>
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
                <View style={styles.dayText}></View>
              </View>
            ))}
          </View>

          {/* Calendar Weeks */}
          {weeks.map((week, wIndex) => (
            <View key={wIndex} style={styles.weekRow}>
              {week.map((day, dIndex) => (
                <View
                  key={dIndex}
                  style={[
                    styles.dayCellContent,
                    dIndex > 0 && styles.verticalBorder,         // đường dọc giữa cột
                  ]}>
                    
                  <View style={styles.day}></View>

                </View>
              ))}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}></View>
            <View style={styles.legendItem}></View>
            <View style={styles.legendItem}></View>
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    marginTop: 15
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  title: {
    height: 25,
    width: 75,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginLeft: 10,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    height: 32,
    width: 120,
    marginLeft: 40
  },
  icon: {
    height: 30,
    width: 30,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 10
  },
  arrow: { fontSize: 16, fontWeight: "bold",fontFamily: "MuseoModerno",  },
  monthTextWrapper: {
    paddingHorizontal: 8,
  },
  monthText: {
    fontFamily: "MuseoModerno", 
    fontSize: 14,
  },
  weekHeader: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#f0f0f0",
    marginTop: 15,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2
  },
  dayText: { 
    width: 23,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    marginBottom: 9
  },
  day: {
    height: 18,
    width: 18,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    marginTop: 5,
  },
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
    marginVertical: 2,
    height: 15,
    width: 100,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },

});
