import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type ReCaptchaV3Props = {
  uri: string;
  onToken: (token: string, action?: string) => void;
};

export type ReCaptchaV3Ref = {
  execute: (action?: string) => void;
};

const ReCaptchaV3 = forwardRef<ReCaptchaV3Ref, ReCaptchaV3Props>(({ uri, onToken }, ref) => {
  const webviewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.token) {
        onToken(data.token, data.action);
      }
    } catch (e) {
      console.warn('Không parse được token từ reCAPTCHA:', e);
    }
  };

  useImperativeHandle(ref, () => ({
    execute: (action = 'login') => {
      webviewRef.current?.postMessage(JSON.stringify({ type: "EXECUTE_RECAPTCHA", action }));
    },
  }));

  return (
    <View style={[styles.container, {height: 0}]}>
      <WebView
        ref={webviewRef}
        source={{ uri }}
        onMessage={handleMessage}
        javaScriptEnabled
        originWhitelist={['*']}
        style={styles.webview}
      />
    </View>
  );
});

ReCaptchaV3.displayName = 'ReCaptchaV3';




export default ReCaptchaV3;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 100,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
