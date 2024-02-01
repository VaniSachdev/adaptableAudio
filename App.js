// http://joesul.li/van/beat-detection-using-web-audio/

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [recording, setRecording] = useState();
  const [sound, setSound] = useState();
  const [bpmResult, setBpmResult] = useState(null);

  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate(status => {
        if (!status.isLoaded) {
          setBpmResult(null);
        }
      });
    }
  }, [sound]);

  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HighQuality
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    try {
      console.log('Stopping recording..');
      setRecording(undefined);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);

      // Create a sound object for the recorded audio
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSound(sound);

      // Analyze BPM of the recorded audio
      await analyzeBPM(uri);
    } catch (err) {
      console.error('Error during stopRecording', err);
    }
  }

  async function playRecording() {
    try {
      // Play the recorded audio
      await sound.playAsync();
    } catch (err) {
      console.error('Error during playRecording', err);
    }
  }

  async function analyzeBPM(uri) {
    try {
      // Load the recorded audio for analysis
      const { sound: audioForAnalysis } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );

      // Ensure that the audioForAnalysis is loaded
      await audioForAnalysis.loadAsync();

      // Get the audio buffer
      const buffer = await audioForAnalysis.downloadAsync();

      // Analyze buffer data (simplified version)
      const peaks = getPeaksAtThreshold(buffer, 0.5);
      const intervalCounts = countIntervalsBetweenNearbyPeaks(peaks);
      const bpmResult = calculateBPM(intervalCounts, audioForAnalysis.sampleRate);

      console.log('BPM Result:', bpmResult);

      // Set the BPM result in the state
      setBpmResult(bpmResult);
    } catch (err) {
      console.error('Error during analyzeBPM', err);
    }
  }

  function getPeaksAtThreshold(buffer, threshold) {
    const peaksArray = [];
    const length = buffer.length;
    for (let i = 0; i < length;) {
      if (buffer[i] > threshold) {
        peaksArray.push(i);
        // Skip forward ~ 1/4s to get past this peak.
        i += 10000;
      }
      i++;
    }
    return peaksArray;
  }

  function countIntervalsBetweenNearbyPeaks(peaks) {
    const intervalCounts = [];
    peaks.forEach(function (peak, index) {
      for (let i = 0; i < 10; i++) {
        const interval = peaks[index + i] - peak;
        const foundInterval = intervalCounts.some(function (intervalCount) {
          if (intervalCount.interval === interval)
            return intervalCount.count++;
        });
        if (!foundInterval) {
          intervalCounts.push({
            interval: interval,
            count: 1
          });
        }
      }
    });
    return intervalCounts;
  }

  function calculateBPM(intervalCounts, sampleRate) {
    // Convert intervals to time in seconds
    const timeIntervals = intervalCounts.map(intervalCount => intervalCount.interval / sampleRate);

    // Calculate average time interval
    const averageTimeInterval = timeIntervals.reduce((acc, val) => acc + val, 0) / timeIntervals.length;

    // Calculate BPM
    const bpm = Math.round(60 / averageTimeInterval);

    return bpm;
  }

  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      {sound && (
        <>
          <Button title="Play Recording" onPress={playRecording} />
          <Button title="Analyze BPM" onPress={() => analyzeBPM(sound._uri)} />
        </>
      )}
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

