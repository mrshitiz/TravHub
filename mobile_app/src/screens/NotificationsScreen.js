import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/themeStyles';
import { apiService } from '../services/apiService';

export default function NotificationsScreen({ onGoBack, currentUser, onOpenPost }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !currentUser.phone) return;

    const unsubscribe = apiService.subscribeToNotifications(currentUser.phone, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
      
      // Mark all as read when viewed
      const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        apiService.markNotificationsAsRead(unreadIds);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const renderNotification = ({ item }) => {
    return (
      <TouchableOpacity 
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
          backgroundColor: item.read ? 'transparent' : 'rgba(14, 165, 233, 0.05)',
          flexDirection: 'row',
          alignItems: 'center'
        }}
        onPress={() => {
          if (item.relatedId && onOpenPost) {
            onOpenPost(item.relatedId);
          }
        }}
      >
        <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon || '🔔'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: item.read ? '400' : '600' }}>
            {item.message}
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#050b14' }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
      }}>
        <TouchableOpacity onPress={onGoBack} style={{ padding: 8, marginRight: 8 }}>
          <Text style={{ color: '#0ea5e9', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>Notifications</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          ListEmptyComponent={
            <View style={{ flex: 1, padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center' }}>
                No notifications yet. You're all caught up!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
