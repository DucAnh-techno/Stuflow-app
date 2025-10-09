import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "src/firebase/firebase";

export async function createSchedule(time: Date, user: string, content: string) {

    const randomColor = () => {
    const min = 200;
    const max = 240;

    const r = Math.floor(Math.random() * (max - min + 1)) + min;
    const g = Math.floor(Math.random() * (max - min + 1)) + min;
    const b = Math.floor(Math.random() * (max - min + 1)) + min;

    return `rgba(${r}, ${g}, ${b})`;
    };

    if (!time || !user || !content) {
        console.log('Thiếu thông tin để thêm schedule');
        return;
    }

    const d = new Date(time);

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());

    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');

    const docSnap = (await getDoc(doc(db, "users", user)));
    if (!docSnap.exists()) {
        console.log('lay file that bai', docSnap);
        return;
    }
    const docData = docSnap.data();

    let schedule = docData.schedule;

    if(schedule) {
        schedule.push({
            daystart: `${yy}-${mm}-${dd}`,
            name: content,
            timestart: `${hour}:${minute}`,
            color: randomColor(),
        });
    } else {
        const temp = [{
            daystart: `${yy}-${mm}-${dd}`,
            name: content,
            timestart: `${hour}:${minute}`,
            color: randomColor(),
        }];

        schedule = temp;
    }



    await setDoc(doc(db, "users", user), {
        schedule: schedule
    }, {merge: true});

    console.log('tao schedule thanh cong');

}