import { Schedule } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function removeSchedule(schedule: Schedule, user: string) {

    if ( !user ) {
        console.log('Thiếu thông tin để thêm schedule');
        return;
    }

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai', docSnap);
        return;
    }
    const docData = docSnap.data();

    const data: Schedule[] = docData.schedule || [];
    
    const newSche = [];

    for (const item of data) {
        if (!(item.name === schedule.name && item.color === schedule.color && item.daystart === schedule.daystart)) {
            newSche.push(item);
        }
    }

    await setDoc(doc(db, "users", user), {
        schedule: newSche
    }, {merge: true});

    console.log('tao schedule thanh cong');

}