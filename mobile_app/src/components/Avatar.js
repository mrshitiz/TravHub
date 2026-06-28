import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { isImageUri, getAvatarSource } from '../utils/helpers';

export default function Avatar({ logo, size = 40, style }) {
  const isTravHub = logo === 'travhub_logo';
  
  if (isTravHub) {
    const fontSize = size * 0.4;
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#050b14', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }, style]}>
        <Text style={{ fontSize: fontSize, fontWeight: '300', color: '#ffffff', letterSpacing: -0.5 }}>t</Text>
        <Text style={{ fontSize: fontSize, fontWeight: '900', color: '#0ea5e9', letterSpacing: -0.5 }}>h</Text>
      </View>
    );
  }

  if (isImageUri(logo)) {
    return (
      <Image 
        source={getAvatarSource(logo)} 
        style={[{ width: size, height: size, borderRadius: size / 2 }, style]} 
      />
    );
  }

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.5 }}>{logo || '💼'}</Text>
    </View>
  );
}
