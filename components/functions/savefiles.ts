import { fileSubSave } from "@/types";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
    import { doc, getDoc, setDoc } from "firebase/firestore";
    import { db } from "src/firebase/firebase";

export async function saveFile( result: DocumentPicker.DocumentPickerResult, name: string, subject: string, user: string | null) {
    const randomColor = () => {
    const hex = Math.floor(Math.random() * 16777215).toString(16);
    return `#${hex.padStart(6, "0")}`;
    };

    if(!user) {console.error('khong co user'); return;}
    if (result.canceled || !result.assets) {
        console.log('missing result');
        return;
    }
    const asset: DocumentPicker.DocumentPickerAsset = result.assets?.[0];
    if (!asset || !asset.uri) {
        console.log('missing asset');
        return;
    }
    if (name === "") {name = "Unkown"}

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai');
        return;
    }
    const docData = docSnap.data();
    const fileData: fileSubSave[] = docData.itemSaved || [];    

    const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
    const fileName = asset.name;
    const dest = `${dir}${fileName}`;

    await FileSystem.copyAsync({ from: asset.uri, to: dest });

    const data = {name: name, uri: dest, color: randomColor()};

    const idx = fileData.findIndex((item) => item.subName === subject);

    if (idx !== -1) {
        fileData[idx].files.push(data);
    }else {
        const sub = {
            subName: subject, 
            files: [{name: name, uri: dest, color: randomColor()}],
            pictures: []
        };
        fileData.push(sub);
    }

    await setDoc(doc(db, "users", user), {
        itemSaved: fileData,
    }, { merge: true});
    
    return (fileData);
}

