import { fileSubSave } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function removeFile( uri: string, subName: string, user: string | null) {
    if(!user) {console.error('khong co user'); return;}

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai');
        return;
    }
    const docData = docSnap.data();
    const fileData: fileSubSave[] = docData.itemSaved || [];    

    const newFile = [];

    for ( const sub of fileData ){
        if( sub.subName === subName) {
            const temp = sub.files.filter(item => item.uri !== uri);
            sub.files = temp;
            newFile.push(sub);
        } else {
            newFile.push(sub);
        }
    }

    await setDoc(doc(db, "users", user), {
        itemSaved: newFile,
    }, { merge: true});
    
    return (newFile);
}

