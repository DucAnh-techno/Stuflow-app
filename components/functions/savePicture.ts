import { fileSubSave } from "@/types";
import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function savePicture( result: ImagePicker.ImagePickerResult, subject: string, user: string | null) {

    if(!user) {console.error('khong co user'); return;}
    if (result.canceled || !result.assets) {
        console.log('missing result');
        return;
    }
    const asset: ImagePickerAsset = result.assets?.[0];
    if (!asset || !asset.uri) {
        console.log('missing asset');
        return;
    }

    const uri = result.assets[0].uri;

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai');
        return;
    }
    const docData = docSnap.data();
    const picturesData: fileSubSave[] = docData.itemSaved || [];    

    const idx = picturesData.findIndex((item) => item.subName === subject);

    if (idx !== -1) {
        picturesData[idx].pictures.push({ uri: uri});
    }else {
        const sub = {
            subName: subject, 
            files: [],
            pictures: [{ uri: uri}]
        };
        picturesData.push(sub);
    }

    await setDoc(doc(db, "users", user), {
        itemSaved: picturesData,
    }, { merge: true});
    
    return (picturesData);
}

