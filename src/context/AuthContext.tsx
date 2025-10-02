// AuthProvider.js
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearSession, getAuth, loginWithPortal } from '../service/authService';

type ContextType = {
  user: string | null;  
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  signIn: (username: string, password: string, recaptchaToken: string) => Promise<any>;
  signOut: () => Promise<void>;
  reload: Date | null;
  setReload: React.Dispatch<React.SetStateAction<Date | null>>;
};

const AuthContext = createContext<ContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  signIn: async () => Promise.resolve(null),
  signOut: async () => Promise.resolve(),
  reload: null,
  setReload: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await getAuth();
        if (s) {
          setUser(s.user); 
        }
      } catch (e) {
        console.log('restore session error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function signIn(username: string, password: string, recaptchaToken: string) {
    if (!recaptchaToken) {
      console.error('khong co recaptcha');
    }
    const data = await loginWithPortal(username, password, recaptchaToken);
    setUser(username);
    return data;
  }

  async function signOut() {
    await clearSession();
    setUser(null);
    // @ts-ignore
    router.replace("/login/page");
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signIn, signOut, reload, setReload }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}