// app/(tabs)/document/page.tsx
import { useAuth } from '@/src/context/AuthContext';
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  RefreshControl
} from "react-native";

import DocumentPage from "../../../components/pages/documentPage";
import PicturePage from "../../../components/pages/picturePage";

const { height, width } = Dimensions.get("window");


export default function ItemSaved () {
    const { reload, setReload } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [showPicture, setShowPicture] = useState(false);
    const [showDocument, setShowDocument] = useState(false);

    useEffect(() => {
        setShowDocument(true);
        setShowPicture(false);
    }, [reload])
 
  const onRefresh = () => {
    setRefreshing(true);

    setReload(new Date());

    setRefreshing(false)
  };

    
    return (
    <>
    <ScrollView showsVerticalScrollIndicator={false} style={{ paddingTop: 26 }}
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
        <TouchableWithoutFeedback>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={ showDocument ? {zIndex: 5} : {zIndex: 0}}>
                    <Pressable
                    onPress={() => {setShowDocument(true); setShowPicture(false);}}
                    >
                        <View style={[
                            showDocument ? [styles.tabShow, {transform: [{translateX: 21}, {translateY: -10}]}] 
                            : [styles.tab, {transform: [{translateX: -24}, {translateY: 7}]}],
                            ]}>
                            <Text style={[styles.tabText, showDocument && {opacity: 1, fontSize: 24, paddingTop: 5}]}>Document</Text>
                        </View>
                    </Pressable>
                    </View>

                    <View style={ showPicture ? {zIndex: 5} : {zIndex: 0}}>
                    <Pressable
                    onPress={() =>{setShowPicture(true); setShowDocument(false);}}
                    >
                        <View style={[
                            showPicture ? [styles.tabShow, {transform: [{translateX: -21}, {translateY: -10}]}] 
                            : [styles.tab, {transform: [{translateX: 24}, {translateY: 7}]}],
                            ]}>
                            <Text style={[styles.tabText, showPicture && {opacity: 1, fontSize: 24, paddingTop: 5}]}>Picture</Text>
                        </View>
                    </Pressable>
                    </View>
                </View>
                {showPicture && <View style={{zIndex: 10}}><PicturePage></PicturePage></View>}
                {showDocument && <View style={{zIndex: 10}}><DocumentPage></DocumentPage></View>}
            </View>
        </TouchableWithoutFeedback>
    </ScrollView>
    </>
)}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    paddingTop: 30
  },
  header: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    position: "relative",
  },
  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    minHeight: height * 0.73
  },
  tab: {
    width: (width / 2) - 40,
    height: 25,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginHorizontal: 10,
    alignItems: "center",    
  },
  tabShow: {
    width: (width / 2) + 30,
    height: 45,
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginHorizontal: -35,
    shadowColor: "#000",
    shadowRadius: 6,
    shadowOpacity: 0.08,
    alignItems: "center",
    marginBottom: -10,
    shadowOffset: {width: 0, height: -5}
  },
  tabText: {
    fontFamily: "MuseoModerno",
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: "bottom",
    opacity: 0.2,
    textAlign: "center",
    paddingTop: 3
  },
})