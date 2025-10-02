import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { ImagePickerAsset } from "expo-image-picker";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "src/firebase/firebase";

export async function saveAvatar( result: ImagePicker.ImagePickerResult, user: string | null) {

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

    const response = await fetch(result.assets[0].uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `avatars/${user}.jpg`);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);

    await setDoc(doc(db, "users", user), {
        avatar: downloadURL,
    }, { merge: true});

    await AsyncStorage.setItem('avatar', JSON.stringify(downloadURL));

    return (downloadURL);
}

