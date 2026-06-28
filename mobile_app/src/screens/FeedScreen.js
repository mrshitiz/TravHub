import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles as themeStyles } from '../styles/themeStyles';
import PostCard from '../components/PostCard';
import { AddCircleIcon, NotificationsIcon } from '../components/SvgIcons';
import { notificationService } from '../services/notificationService';

export const FeedScreen = ({
  feedHook,
  onViewProfile,
  onOpenPostModal,
  onActionMenu,
  onChat,
  onComment,
  onSave,
  savedPosts,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) => {
  const flatListRef = useRef(null);

  const handleLoadNew = () => {
    feedHook.loadNewPosts();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotificationPrompt(true);
      }
    }
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#050b14' }}>
      {/* App Header */}
      <View style={themeStyles.appHeader}>
        <TouchableOpacity 
          style={themeStyles.headerIconLeft}
          onPress={onOpenPostModal}
        >
          <AddCircleIcon size={26} color="#ffffff" />
        </TouchableOpacity>
        <Text style={themeStyles.headerLogoText}>
          <Text style={{ fontWeight: '300', color: '#ffffff' }}>trav</Text>
          <Text style={{ fontWeight: '900', color: '#0ea5e9' }}>hub</Text>
        </Text>
        <TouchableOpacity 
          style={themeStyles.headerIconRight}
          onPress={onOpenNotifications}
        >
          <NotificationsIcon size={26} color="#ffffff" />
          {unreadNotificationsCount > 0 && (
            <View style={{
              position: 'absolute',
              top: -2,
              right: -2,
              backgroundColor: '#ef4444',
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notification Enable Prompt */}
      {showNotificationPrompt && (
        <View style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(14, 165, 233, 0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#e2e8f0', fontSize: 13, flex: 1, marginRight: 10 }}>Never miss a message. Enable push notifications.</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setShowNotificationPrompt(false)}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', paddingVertical: 4 }}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ backgroundColor: '#0ea5e9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}
              onPress={async () => {
                const token = await notificationService.registerForPushNotificationsAsync();
                if (token) {
                  setShowNotificationPrompt(false);
                } else {
                  Alert.alert('Notice', 'Could not enable notifications.');
                }
              }}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Inline Loading Animation Header */}
      {feedHook.refreshing && (
        <View style={themeStyles.refreshLoadingContainer}>
          <ActivityIndicator size="small" color="#0ea5e9" />
          <Text style={themeStyles.refreshLoadingText}>Updating travel feed...</Text>
        </View>
      )}

      {/* New Posts Pill */}
      {feedHook.newPostsAvailable && feedHook.newPostsAvailable.length > 0 && (
        <TouchableOpacity style={localStyles.newPostsPill} onPress={handleLoadNew}>
          <Text style={localStyles.newPostsText}>
            ↑ {feedHook.newPostsAvailable.length} New Post{feedHook.newPostsAvailable.length > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      {/* Feed List */}
      <FlatList
        ref={flatListRef}
        data={feedHook.filteredFeed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            onViewProfile={onViewProfile}
            onActionMenu={onActionMenu}
            onChat={onChat}
            onComment={onComment}
            onSave={onSave}
            isSaved={(savedPosts || []).includes(item.id)}
          />
        )}
        contentContainerStyle={themeStyles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={feedHook.handleRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
          />
        }
        onEndReached={feedHook.loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          feedHook.loadingMore ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#0ea5e9" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !feedHook.refreshing ? <Text style={themeStyles.emptyText}>No listings found on your feed.</Text> : null
        }
      />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  newPostsPill: {
    position: 'absolute',
    top: 70, // Below header
    alignSelf: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newPostsText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  }
});

export default FeedScreen;
