import React, { useState, useRef } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { initializeAudioAnalyzer, loadAudio } from './audioAnalyzer';

export default function App() {
  const [bpmResult, setBpmResult] = useState(null);
  const webViewRef = useRef(null);

  function onBeatDetected() {
    setBpmResult('Beat Detected!');
    // Send the BPM information back to the WebView if needed
    webViewRef.current.injectJavaScript(`onBeatDetected("${getCurrentBpm()}")`);
  }

  function getCurrentBpm() {
    // Implement BPM calculation logic here
    // For now, return a placeholder value
    const result = "120";
    return result;
  }

  function onMessage(event) {
    const { data } = event.nativeEvent;
    setBpmResult(data);
  }

  async function onWebViewLoad() {
    try {
      const audioFileUri = require('./memo.m4a');
      await loadAudio(audioFileUri);
    } catch (error) {
      console.error('Error loading audio:', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text> code ! </Text>
      <Button title="Reload WebView" onPress={() => webViewRef.current.reload()} />
      <WebView
        ref={webViewRef}
        source={{ html: require('./audioAnalyzer.html') }}
        onMessage={onMessage}
        onLoad={onWebViewLoad}
      />
      {bpmResult !== null && (
        <Text style={styles.resultText}>BPM Result: {bpmResult}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
  resultText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
