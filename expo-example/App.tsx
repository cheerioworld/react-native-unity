import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import UnityView from '@azesmway/react-native-unity';

export default function App() {
  const [showUnity, setShowUnity] = useState(false);

  return (
    <View style={styles.container}>
      {showUnity ? (
        <UnityView
          onPlayerUnload={() => {
            console.log('onPlayerUnload');
          }}
          onPlayerQuit={() => {
            console.log('onPlayerQuit');
          }}
          onUnityMessage={(message) => {
            console.log('onUnityMessage', message);
          }}
          // fullScreen={true}
        />
      ) : (
        <View style={styles.container}>
          <Text>Open up App.tsx to start working on your app!</Text>
          <Button title="Show Unity" onPress={() => setShowUnity(true)} />
          <StatusBar style="auto" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
