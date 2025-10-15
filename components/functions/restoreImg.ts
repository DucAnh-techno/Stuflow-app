import { fileSubSave } from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function restorePicture( uri: string, subject: string, user: string | null) {

    if(!user || !uri) {console.error('khong co user'); return([]);}

    const afterUUID = uri.match(/Application\/[A-F0-9\-]+\/(.*)/i)?.[1];

    if(!afterUUID) {console.error('khong co user'); return([]);}

    const newUri = FileSystem.documentDirectory + afterUUID.replace(/^Documents\//, "");

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai');
        return([]);
    }
    const docData = docSnap.data();
    const fileData: fileSubSave[] = docData.itemSaved || [];    

    const newFileData = fileData.map(sub => {
        if (sub.subName === subject) {
            const updatedFiles = sub.pictures.map(item => {
            if (item.uri === uri) {
                return { ...item, uri: newUri }; // đổi giá trị uri
            }
            return item; // giữ nguyên các file khác
            });

            return { ...sub, pictures: updatedFiles };
        }

        return sub; // giữ nguyên các môn khác
    });

    await setDoc(doc(db, "users", user), {
        itemSaved: newFileData,
    }, { merge: true});
    
    return (newFileData);
}

