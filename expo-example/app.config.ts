import type { ExpoConfig } from '@expo/config';

export default (): ExpoConfig => ({
  name: 'react-native-unity-example',
  slug: 'react-native-unity-example',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: false,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.cheerioworld.reactnativeunity',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    // 'expo-router',
    // [
    //   'expo-splash-screen',
    //   {
    //     image: './assets/splash-icon.png',
    //     imageWidth: 200,
    //     resizeMode: 'contain',
    //     backgroundColor: '#ffffff',
    //   },
    // ],
    [
      '../app.plugin.js',
      {
        unityExportDir:
          '/Users/solarisn/dev/Cheerio/react-native-unity/expo-example/build',
        quest: {
          panel: {
            freeResizing: {
              enabled: true,
              lockAspectRatio: true,
              limits: {
                minWidth: 0.1,
                minHeight: 0.1,
                maxWidth: 1,
                maxHeight: 1,
              },
            },
          },
          layout: {
            defaultHeight: '640dp',
            defaultWidth: '1024dp',
          },
        },
      },
    ],
  ],
});
