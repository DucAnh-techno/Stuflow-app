// Sidenav.tsx
import { useAuth } from '@/src/context/AuthContext';
import { usePathname, useRouter } from "expo-router";
import { BookOpen, Calendar, House, FolderSymlink , AlarmClock  } from "lucide-react-native";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";

// Định nghĩa tabs bên ngoài component để tránh tái tạo mỗi render (giúp ESLint & deps ổn)
const TABS = [
  
  
  { id: "coucalendar", href: "/coucalendar/page", icon: BookOpen },
  { id: "wcalendar", href: "/wcalendar/page", icon: Calendar },
  { id: "home", href: "/", icon: House },
  { id: "itemsaved", href: "/itemsaved/page", icon: FolderSymlink  },
  { id: "schedule", href: "/schedule/page", icon: AlarmClock },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Sidenav() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { reload, setReload} = useAuth();

  const tabs = TABS; // typed as const
  const tabCount = tabs.length;
  const tabWidth = (SCREEN_WIDTH * 0.73) / tabCount;

  // index hiện tại (được animate trên UI thread)
  const activeIndex = useSharedValue(0);

  // khi pathname thay đổi, tìm index tương ứng và cập nhật shared value
  useEffect(() => {
    // tìm index khớp: full match hoặc path bắt đầu bằng href + '/'
    const idx = tabs.findIndex((t) =>
      pathname === t.href || pathname.startsWith(t.href + "/")
    );
    const target = idx >= 0 ? idx : 0;
    activeIndex.value = withSpring(target, { damping: 100000, stiffness: 200000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, tabWidth]); // include tabWidth vì nó dùng trong animated calculation logic

  // highlight pill style: translateX dựa trên activeIndex
  const highlightStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(activeIndex.value * tabWidth + (tabWidth * 0.13) , {
            damping: 70,
            stiffness: 800,
          }),
        },
      ],
    };
  }, [tabWidth]);

  const handleTabPress = (href: string, isActive: boolean) => {
    const now = new Date();
      if (isActive) {
        setReload(now);
        console.log(reload);
      } else {
        router.push(href as any);
      }
  }

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {/* Highlight pill (absolute, nằm dưới icon) */}


          <View style={styles.nav2}>
            <View style={styles.nav3}>
              <Animated.View
                style={[
                  styles.highlight,
                  { width: tabWidth * 0.75, zIndex: 10 }, // pill nhỏ hơn tab để có khoảng padding 10 px
                  highlightStyle,
                ]}
              />
            {tabs.map((tab, index) => {
              // isActive dùng để đổi màu ngay lập tức (JS thread)
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

              return (
                <TabButton
                  key={tab.id}
                  index={index}
                  tab={tab}
                  isActive={isActive}
                  activeIndex={activeIndex}
                  tabWidth={tabWidth }
                  onPress={() => {handleTabPress(tab.href, isActive)}}
                />
              );
            })}
            </View>
          </View>
      </View>
    </View>
  );
}

/** Component cho mỗi nút (để dùng hooks reanimated an toàn) */
function TabButton({
  tab,
  index,
  isActive,
  activeIndex,
  tabWidth,
  onPress,
}: {
  tab: (typeof TABS)[number];
  index: number;
  isActive: boolean;
  activeIndex: SharedValue<number>;
  tabWidth: number;
  onPress: () => void;
}) {
  const Icon = tab.icon;

  // icon animation: nhấc lên & scale khi active
  const animatedIcon = useAnimatedStyle(() => {
    const selected = activeIndex.value === index;
    return {
      transform: [
        { translateY: withSpring(selected ? -6 : 0, { damping: 20, stiffness: 300 }) },
        { scale: withSpring(selected ? 1.14 : 1, { damping: 20, stiffness: 300 }) },
      ],
    };
  }, []);

  return (
    <TouchableOpacity
      key={tab.id}
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.tab, { width: tabWidth * 0.1}]}
    >
      <Animated.View style={[animatedIcon, { alignItems: "center", justifyContent: "center" }]}>
        <Icon size={28} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#000" : "#8b8b8b"} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    // để chắc chắn nav nằm trên cùng UI khác
    width: "100%",
    alignItems: "center",
  },
  nav: {
    position: "absolute",
    bottom: 22,
    flexDirection: "row",
    alignItems: "center",
    height: 65,
    width: "75%",
    marginHorizontal: "3%",
    backgroundColor: "#fff",
    borderRadius: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  nav2: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    height: 65,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 8,
    paddingHorizontal: "1%",
    overflow: "hidden",
  },
  nav3: {
    flexDirection: "row",
    alignItems: "center",
    height: 65,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 70,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  highlight: {
    position: "absolute",
    bottom: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#000",
    opacity: 0.95,
    // subtle shadow for pill
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
});
