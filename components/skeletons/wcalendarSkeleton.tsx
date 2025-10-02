import React from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

const { height, width } = Dimensions.get("window");
const pageWidth = width * 0.8293;

export default function SkeletonWeekCard(): React.JSX.Element {
  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={[styles.card, styles.skeletonCard]}>

          {/* Header skeleton */}
          <View style={[styles.header, styles.skeletonHeader]}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonMonth} />
          </View>

          {/* Week names skeleton (horizontal) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weekHeader}>
              {Array.from({ length: 7 }).map((_, i) => (
                <View key={i} style={styles.skeletonDayWrapper}>
                  <View style={styles.skeletonDay} />
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Subcontent / list skeleton */}
          <View style={styles.subcont}>
            <View style={{ minHeight: height * 0.5, width: "100%", paddingVertical: 10 }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <View key={idx} style={styles.skeletonSubItem}>
                  <View style={styles.skeletonLineShort} />
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: "50%", marginTop: 8 }]} />
                </View>
              ))}
            </View>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: width * 0.035,
    marginTop: 26,
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: width * 0.05,
    minHeight: height * 0.7,
  },

  /* Reused layout styles (kept similar to original WeekCalendar) */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
    marginTop: 4,
    marginRight: 8
  },
  weekHeader: {
    flexDirection: "row",
    marginTop: 14,
    width: pageWidth,
  },
  subcont: {
    flexDirection: "row",
    width: "100%",
    minHeight: "60%",
    borderWidth: 1,
    borderColor: "gray",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  /* Skeleton-specific styles */
  skeletonCard: {
    backgroundColor: "#fafafa",
  },
  skeletonHeader: {

    justifyContent: "space-between",
  },
  skeletonTitle: {
    width: pageWidth * 0.40,
    height: 25,
    borderRadius: 6,
    backgroundColor: "#e6e6e6",
    marginLeft: 20,
    transform: [{translateY: -13}]
  },
  skeletonMonth: {
    width: 110,
    height: 55,
    borderRadius: 8,
    backgroundColor: "#e6e6e6",
    marginRight: 15,
  },
  skeletonDayWrapper: {
    width: pageWidth / 7,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2,
  },
  skeletonDay: {
    width: "65%",
    height: 50,
    borderRadius: 6,
    backgroundColor: "#e9e9e9",
    marginBottom: 0
  },
  skeletonSubItem: {
    width: "90%",
    minHeight: 90,
    margin: "5%",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
  },
  skeletonLine: {
    width: "85%",
    height: 14,
    borderRadius: 6,
    backgroundColor: "#e6e6e6",
    marginTop: 10,
  },
  skeletonLineShort: {
    width: "40%",
    height: 16,
    borderRadius: 6,
    backgroundColor: "#e6e6e6",
  },

  /* minimal text style to avoid lint complaining about unused import Text */
  textHidden: {
    display: "none",
  },
});
