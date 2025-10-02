import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = "https://stuflow-notify.vercel.app";

async function saveSession( token: string, timestamp: string, user: string ) {
    try {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('timestamp', timestamp);
        await AsyncStorage.setItem('user', user);
    } catch (error) {
        console.error("Lỗi khi lưu AsyncStorage: ", error);
    }
}

export async function loginWithPortal(username: string, password: string, recaptchaToken: string) {
    const resLogin = await fetch(`${BACKEND_URL}/api/lib/auth/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, recaptchaToken }),
    });
    if (!resLogin.ok) {
    const errText = await resLogin.text();
    console.error("Login failed -LoginWithPortal:", resLogin.status, errText);
    throw new Error("Đăng nhập không thành công");
    }

    const temp = await resLogin.json();
    const data = temp.dataLogin;

    await saveSession(data.token, data.timestamp, username);
    return data;
}

export async function getAuth() {
    try {
        const token = await AsyncStorage.getItem('token');
        const timestamp = await AsyncStorage.getItem('timestamp');
        const user = await AsyncStorage.getItem('user');

        return {token, timestamp, user};
    } catch (error) {
        console.error('Lấy session thất bại: ', error);
    }
}

export async function clearSession() {
    try {
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Xóa session thất bại: ', error);
    }
}