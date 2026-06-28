import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

const IosInstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on Web
    if (Platform.OS !== 'web') return;

    // Detect iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Detect if running as standalone PWA
    const isInStandaloneMode = () => 
      ('standalone' in window.navigator) && (window.navigator.standalone);

    // Show prompt only if on iOS Safari and NOT already installed
    if (isIos() && !isInStandaloneMode()) {
      // Delay showing the prompt slightly so it doesn't disrupt initial load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.promptBox}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => setIsVisible(false)}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Install TravHub App</Text>
        <Text style={styles.text}>
          Install this application on your home screen for quick and easy access when you're on the go.
        </Text>
        <Text style={styles.instructions}>
          1. Tap the <Text style={{fontWeight: 'bold'}}>Share</Text> icon below.{"\n"}
          2. Select <Text style={{fontWeight: 'bold'}}>Add to Home Screen</Text>.
        </Text>
        <View style={styles.arrowDown} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20, // Sit right above the Safari menu bar
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  promptBox: {
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    padding: 16,
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  text: {
    color: '#e0f2fe',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  instructions: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 10,
    borderRadius: 8,
  },
  arrowDown: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0ea5e9',
  }
});

export default IosInstallPrompt;
