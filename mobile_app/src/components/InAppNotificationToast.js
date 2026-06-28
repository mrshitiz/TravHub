import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * InAppNotificationToast
 * Props:
 *   notification: { senderName, senderLogo, message, chatId } | null
 *   onPress: () => void   — called when user taps the toast (navigate to chats)
 *   onDismiss: () => void — called when toast auto-dismisses or user taps
 */
export const InAppNotificationToast = ({ notification, onPress, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (notification) {
      // Clear any lingering timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 4 seconds
      timerRef.current = setTimeout(() => {
        slideOut();
      }, 4000);
    } else {
      // Reset position immediately when notification is cleared externally
      translateY.setValue(-120);
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification]);

  const slideOut = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const handlePress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    slideOut();
    // Navigate after slide-out starts (short delay so animation feels good)
    setTimeout(() => {
      onPress?.();
    }, 150);
  };

  if (!notification) return null;

  const isEmoji = notification.senderLogo && !notification.senderLogo.startsWith('http');

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#0f1c2e',
          borderRadius: 18,
          padding: 14,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: 'rgba(14, 165, 233, 0.35)',
          // Shadow for depth
          shadowColor: '#0ea5e9',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 12,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: 'rgba(14, 165, 233, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            borderWidth: 1.5,
            borderColor: '#0ea5e9',
          }}
        >
          <Text style={{ fontSize: isEmoji ? 20 : 14 }}>
            {isEmoji ? notification.senderLogo : '💼'}
          </Text>
        </View>

        {/* Text content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text style={{ fontSize: 9, color: '#0ea5e9', fontWeight: '800', marginRight: 6, letterSpacing: 0.8 }}>
              💬 CHAT MESSAGE
            </Text>
          </View>
          <Text numberOfLines={1} style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 2 }}>
            {notification.senderName}
          </Text>
          <Text numberOfLines={1} style={{ color: '#9ca3af', fontSize: 13 }}>
            {notification.message}
          </Text>
        </View>

        {/* Dismiss × */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            slideOut();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: 8 }}
        >
          <Text style={{ color: '#6b7280', fontSize: 18, lineHeight: 20 }}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default InAppNotificationToast;
