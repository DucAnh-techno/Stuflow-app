import { useFonts } from 'expo-font';
import React, { createContext, useContext } from 'react';
import { Text } from 'react-native';

export const FontContext = createContext({ fontsLoaded: false });

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontsLoaded] = useFonts({
    MuseoModerno: require("../../assets/fonts/MuseoModerno-VariableFont_wght.ttf"),
    MuseoModernoItalic: require("../../assets/fonts/MuseoModerno-Italic-VariableFont_wght.ttf"),
    Pacifico: require("../../assets/fonts/Pacifico-Regular.ttf")
  });

  return (
    <FontContext.Provider value={{ fontsLoaded }}>
      {fontsLoaded ? children : <Text>Loading...</Text>}
    </FontContext.Provider>
  );
};

export function useFont() {
    return useContext(FontContext);
}