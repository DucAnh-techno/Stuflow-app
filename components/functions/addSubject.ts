import { fileSubSave } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function addSub( subject: string, user: string | null) {

    if(!user) {console.error('khong co user'); return;}


    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai');
        return;
    }
    const docData = docSnap.data();
    const fileData: fileSubSave[] = docData.itemSaved || [];    


    const idx = fileData.findIndex((item) => item.subName === subject);

    if (idx !== -1) {
        return ({message: "Môn học đã tồn tại"});
    }else {
        const sub = {
            subName: subject, 
            files: [],
            pictures: []
        };
        fileData.push(sub);
    }

    await setDoc(doc(db, "users", user), {
        itemSaved: fileData,
    }, { merge: true});

    await AsyncStorage.setItem('savedFiles', JSON.stringify(fileData));

    return (fileData);
}

