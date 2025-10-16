import * as FileSystem from "expo-file-system/legacy";
import { doc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function restoreAvatar( uri: string, user: string | null) {

    if(!user || !uri) {console.error('khong co user'); return([]);}

    const afterUUID = uri.match(/Application\/[A-F0-9\-]+\/(.*)/i)?.[1];

    if(!afterUUID) {console.error('khong co user'); return([]);}

    const newUri: string = FileSystem.documentDirectory + afterUUID.replace(/^Documents\//, "");


    await setDoc(doc(db, "users", user), {
        avatar: newUri,
    }, { merge: true});
    
    return (newUri);
}

