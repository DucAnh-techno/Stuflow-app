import { fileSubSave } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function removePicture( uri: string, subject: string, user: string | null) {
    if(!user) {console.error('khong co user'); return;}

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai');
        return;
    }
    const docData = docSnap.data();
    const fileData: fileSubSave[] = docData.itemSaved || [];    

    const newPicture = [];

    for ( const sub of fileData ){
        if( sub.subName === subject) {
            const temp = sub.pictures.filter(item => item.uri !== uri);
            sub.pictures = temp;
            newPicture.push(sub);
        } else {
            newPicture.push(sub);
        }
    }

    await setDoc(doc(db, "users", user), {
        itemSaved: newPicture,
    }, { merge: true});
    

    await AsyncStorage.setItem('savedFiles', JSON.stringify(newPicture));

    return (newPicture);
}

