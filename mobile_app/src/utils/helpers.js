import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export const isImageUri = (str) => {
  if (!str) return false;
  return str.length > 6 || str.startsWith('http') || str.startsWith('data:') || str.startsWith('file:') || str.startsWith('content:');
};

export const compressAndSaveLogo = async (rawUri, zoom, dx, dy) => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || (!rawUri.startsWith('data:image') && !rawUri.startsWith('blob:'))) {
      resolve(rawUri);
      return;
    }
    
    const img = new window.Image();
    img.src = rawUri;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 200; // Standard compressed size
      canvas.width = size;
      canvas.height = size;
      
      ctx.fillStyle = '#0f172a'; // Match sidebar color theme
      ctx.fillRect(0, 0, size, size);
      
      const scale = zoom;
      const sSize = Math.min(img.width, img.height);
      
      // Calculate crop bounds based on scale & scroll position
      const sx = (img.width - sSize) / 2 - (dx * (sSize / 180)) / scale;
      const sy = (img.height - sSize) / 2 - (dy * (sSize / 180)) / scale;
      const sWidth = sSize / scale;
      const sHeight = sSize / scale;
      
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
      resolve(canvas.toDataURL('image/webp', 0.8));
    };
    img.onerror = () => {
      resolve(rawUri);
    };
  });
};

export const getAvatarSource = (logo) => {
  if (logo === 'travhub_logo') {
    return require('../../assets/icon.png');
  }
  return { uri: logo };
};

export const compressImageNative = async (uri) => {
  if (Platform.OS === 'web') return uri;
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
    );
    return manipResult.uri;
  } catch (err) {
    console.error("Error compressing image:", err);
    return uri;
  }
};
