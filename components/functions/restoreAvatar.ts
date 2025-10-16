import * as FileSystem from "expo-file-system/legacy";
import { doc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function restoreAvatar( uri: string, user: string | null) {

    if(!user || !uri) {console.error('khong co user'); return([]);}

    const afterApp = uri.split("StuFlow/").pop();

    if (!afterApp) {
    console.error('không tìm thấy StuFlow trong uri');
    return [];
    }

    // Tạo lại uri đúng cho app hiện tại
    const newUri = FileSystem.cacheDirectory + afterApp;


    await setDoc(doc(db, "users", user), {
        avatar: newUri,
    }, { merge: true});
    
    return (newUri);
}

