import { fileSubSave } from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function restoreFile( uri: string, name: string, subject: string, user: string | null) {

    if(!user || !uri) {console.error('khong co user'); return([]);}

    const afterApp = uri.split("StuFlow/").pop();

    if (!afterApp) {
    console.error('không tìm thấy StuFlow trong uri');
    return [];
    }

    // Tạo lại uri đúng cho app hiện tại
    const newUri = FileSystem.documentDirectory + afterApp;

    if (name === "") {name = "Unkown"}

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai');
        return([]);
    }
    const docData = docSnap.data();
    const fileData: fileSubSave[] = docData.itemSaved || [];    

    const newFileData = fileData.map(sub => {
        if (sub.subName === subject) {
            const updatedFiles = sub.files.map(item => {
            if (item.uri === uri) {
                return { ...item, uri: newUri }; // đổi giá trị uri
            }
            return item; // giữ nguyên các file khác
            });

            return { ...sub, files: updatedFiles };
        }

        return sub; // giữ nguyên các môn khác
    });

    await setDoc(doc(db, "users", user), {
        itemSaved: newFileData,
    }, { merge: true});
    
    return (newFileData);
}

