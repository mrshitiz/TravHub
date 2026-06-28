/* eslint-disable max-lines */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Modal, TouchableOpacity, Text, Alert, BackHandler, StatusBar, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from './src/hooks/useAuth';
import { useFeed } from './src/hooks/useFeed';
import { useProfile } from './src/hooks/useProfile';
import WelcomeScreen from './src/screens/WelcomeScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileEditorModal from './src/components/ProfileEditorModal';
import PostModal from './src/components/PostModal';
import PostQuickViewModal from './src/components/PostQuickViewModal';
import FloatingConsole from './src/components/FloatingConsole';
import { styles } from './src/styles/themeStyles';
import { apiService } from './src/services/apiService';
import CommentsModal from './src/components/CommentsModal';
import InAppNotificationToast from './src/components/InAppNotificationToast';
import { notificationService } from './src/services/notificationService';
import DesktopLandingPage from './src/screens/DesktopLandingPage';

export default function App() {

  // 1. Authentication Layer Hook
  const auth = useAuth(async (userDoc) => {
    // If permission is already granted, silently sync the token to the backend.
    // This repopulates the token if it was wiped from the database without triggering browser blockers.
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      await notificationService.registerForPushNotificationsAsync(userDoc.phone);
    }
  });

  // 2. Feed Layer Hook
  const feed = useFeed(auth);

  // 3. Profile Management Hook
  const profile = useProfile(auth, (updatedFields) => {
    // Apply profile updates directly to auth state to sync globally
    if (updatedFields.agencyName !== undefined) auth.setAgencyName(updatedFields.agencyName);
    if (updatedFields.city !== undefined) auth.setCity(updatedFields.city);
    if (updatedFields.agencyLogo !== undefined) auth.setAgencyLogo(updatedFields.agencyLogo);
    if (updatedFields.userType !== undefined) auth.setCurrentUserType(updatedFields.userType);
    if (updatedFields.agencyType !== undefined) auth.setCurrentAgencyType(updatedFields.agencyType);
    if (updatedFields.hotelCategory !== undefined) auth.setCurrentHotelCategory(updatedFields.hotelCategory);
    if (updatedFields.specializations !== undefined) auth.setCurrentSpecializations(updatedFields.specializations);
    if (updatedFields.gstin !== undefined) auth.setCurrentGstin(updatedFields.gstin);
    if (updatedFields.bio !== undefined) auth.setBio(updatedFields.bio);
    if (updatedFields.email !== undefined) auth.setEmail(updatedFields.email);
    if (updatedFields.streetAddress !== undefined) auth.setStreetAddress(updatedFields.streetAddress);
    if (updatedFields.country !== undefined) auth.setCountry(updatedFields.country);
    if (updatedFields.state !== undefined) auth.setState(updatedFields.state);
    if (updatedFields.pincode !== undefined) auth.setPincode(updatedFields.pincode);
    if (updatedFields.handlingPerson !== undefined) auth.setHandlingPerson(updatedFields.handlingPerson);
    if (updatedFields.handlingPosition !== undefined) auth.setHandlingPosition(updatedFields.handlingPosition);
  });

  // 4. Component Routing & UI state
  const [viewedProfile, setViewedProfile] = useState(null);
  const [profileTab, setProfileTab] = useState('all');
  const [selectedGridPost, setSelectedGridPost] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);

  // 5. Global chats subscription — drives unread badge + in-app notifications
  const [allChats, setAllChats] = useState([]);
  const [inAppNotification, setInAppNotification] = useState(null);
  const [pendingChatIdToOpen, setPendingChatIdToOpen] = useState(null);
  const screenRef = useRef(auth.screen);
  const activeChatRef = useRef(activeChat);

  // Keep refs in sync with state so subscription callbacks can read latest values
  useEffect(() => { screenRef.current = auth.screen; }, [auth.screen]);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Subscribe to chats at app level for global unread count
  useEffect(() => {
    if (!auth.phone) return;
    const unsubscribe = apiService.subscribeToChats(
      auth.phone,
      (chatsList) => {
        setAllChats(prev => {
          // Detect a new incoming message to show an in-app notification
          // Only notify when:
          //   - user is NOT on the chats screen, or is on chats but has no activeChat open
          //     but this specific chat is not the active one
          chatsList.forEach(chat => {
            const isUnreadForMe = chat.unread && chat.lastSender && chat.lastSender !== auth.phone;
            if (!isUnreadForMe) return;

            // Find the previous version of this chat
            const prevChat = prev.find(c => c.id === chat.id);
            const prevUpdatedAt = prevChat?.updatedAt || '';
            const currentUpdatedAt = chat.updatedAt || '';

            // Only fire if this is a genuinely new message (updatedAt changed)
            const isNewMessage = currentUpdatedAt > prevUpdatedAt;
            if (!isNewMessage) return;

            // Don't notify if the user is already inside this specific chat
            const isViewingThisChat = activeChatRef.current?.id === chat.id;
            if (isViewingThisChat) return;

            // Determine sender info from participantDetails
            const senderPhone = chat.lastSender;
            const senderDetails = chat.participantDetails?.[senderPhone] || {};
            const senderName = senderDetails.agencyName || 'Unknown';
            const senderLogo = senderDetails.agencyLogo || '💼';

            setInAppNotification({
              senderName,
              senderLogo,
              message: chat.lastMessage || 'Sent you a message',
              chatId: chat.id,
              chat,
            });
          });

          return chatsList;
        });
      },
      (err) => console.error('App-level chat subscription error:', err)
    );
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.phone]);

  // Count total unread messages across all chats
  const totalUnread = allChats.reduce((sum, c) => {
    if (c.unread && c.lastSender && c.lastSender !== auth.phone) {
      return sum + (c.unreadCount || 1);
    }
    return sum;
  }, 0);

  // Global Notifications Subscription for Bell Badge
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  useEffect(() => {
    if (!auth.phone) return;
    const unsubscribe = apiService.subscribeToNotifications(
      auth.phone,
      (notifs) => {
        const unreadCount = notifs.filter(n => !n.read).length;
        setUnreadNotificationsCount(unreadCount);
      }
    );
    return () => unsubscribe();
  }, [auth.phone]);

  // System Push Notification Tap Handler
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'OPEN_CHAT') {
        setPendingChatIdToOpen(event.data.chatId);
      }
    };
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  // Process pending chat when allChats is available
  useEffect(() => {
    if (pendingChatIdToOpen && allChats.length > 0) {
      const targetChat = allChats.find(c => c.id === pendingChatIdToOpen);
      if (targetChat) {
        setActiveChat(targetChat);
        auth.setScreen('chats');
        setPendingChatIdToOpen(null);
      }
    }
  }, [pendingChatIdToOpen, allChats, auth]);

  // 5. Android Back Button Handler — navigate back instead of exiting
  useEffect(() => {
    const handleBackPress = () => {
      // Priority 1: Close any open modal
      if (selectedGridPost) { setSelectedGridPost(null); return true; }
      if (activeCommentPost) { setActiveCommentPost(null); return true; }
      if (feed.inquiryModalVisible) { feed.setInquiryModalVisible(false); return true; }
      if (profile.profileModalVisible) { profile.setProfileModalVisible(false); return true; }
      if (feed.actionMenuVisible) { feed.setActionMenuVisible(false); return true; }

      // Priority 2: If inside an active chat, go back to chat list
      if (activeChat) { setActiveChat(null); return true; }

      // Priority 3: If on profile/chats screen, go back to feed
      if (auth.screen === 'profile') {
        setViewedProfile(null);
        auth.setScreen('feed');
        return true;
      }
      if (auth.screen === 'chats') {
        auth.setScreen('feed');
        return true;
      }

      // Priority 4: On feed (home) — confirm exit
      if (auth.screen === 'feed') {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit TravHub?',
          [
            { text: 'Stay', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true;
      }

      return false; // Let OS handle it (e.g., on welcome screen)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => subscription.remove();
  }, [auth.screen, activeChat, selectedGridPost, activeCommentPost, feed.inquiryModalVisible, profile.profileModalVisible, feed.actionMenuVisible]);

  const handleSavePost = async (postItem) => {
    if (!auth.phone) {
      Alert.alert("Authentication Required", "You must be logged in to save listings.");
      return;
    }
    const isCurrentlySaved = (auth.savedPosts || []).includes(postItem.id);
    const newSavedState = !isCurrentlySaved;

    // Optimistic UI update
    if (newSavedState) {
      auth.setSavedPosts([...auth.savedPosts, postItem.id]);
    } else {
      auth.setSavedPosts(auth.savedPosts.filter(id => id !== postItem.id));
    }

    try {
      await apiService.toggleSavePost(auth.phone, postItem.id, newSavedState);
    } catch (err) {
      console.error("Failed to toggle save post:", err);
      Alert.alert("Error", "Could not update saved listings. Please try again.");
      // Rollback
      if (newSavedState) {
        auth.setSavedPosts(auth.savedPosts.filter(id => id !== postItem.id));
      } else {
        auth.setSavedPosts([...auth.savedPosts, postItem.id]);
      }
    }
  };

  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 768;

  // Handle HTML splash screen removal
  useEffect(() => {
    if (Platform.OS === 'web') {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.display = 'none';
      }
    }
  }, []);

  const [progressWidth, setProgressWidth] = useState('95%');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!auth.isInitializing) {
      setProgressWidth('100%');
      // Hold the 100% state for a split second so the user sees it complete
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [auth.isInitializing]);

  if (showSplash) {
    // Render the React version of the splash screen to seamlessly take over from the HTML one
    // It will jump to 95% and then to 100% when finished
    return (
      <View style={{ flex: 1, backgroundColor: '#050b14', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 48, fontWeight: '300', color: '#ffffff', letterSpacing: -1 }}>trav</Text>
          <Text style={{ fontSize: 48, fontWeight: '900', color: '#0ea5e9', letterSpacing: -1 }}>hub</Text>
        </View>
        <View style={{ marginTop: 40, width: 200, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: progressWidth, backgroundColor: '#0ea5e9', borderRadius: 4 }} />
        </View>
      </View>
    );
  }

  // Desktop Landing Page Override
  if (isDesktopWeb) {
    return (
      <SafeAreaProvider>
        <DesktopLandingPage />
      </SafeAreaProvider>
    );
  }

  // Welcome Screen Route
  if (auth.screen === 'welcome') {
    return (
      <SafeAreaProvider>
        <WelcomeScreen authHook={auth} />
      </SafeAreaProvider>
    );
  }

  const isOwnProfile = !viewedProfile || 
    (viewedProfile.phone && auth.phone && viewedProfile.phone === auth.phone) ||
    (viewedProfile.agencyName === auth.agencyName && viewedProfile.city === auth.city);

  return (
    <SafeAreaProvider>
      {/* Global StatusBar — ensures correct style on all screens/platforms */}
      <StatusBar barStyle="light-content" backgroundColor="#050b14" translucent={false} />
      <View style={styles.container}>
      {/* Dynamic Screen Component Router */}
      {auth.screen === 'feed' ? (
        <FeedScreen
          feedHook={feed}
          onViewProfile={async (profileData) => {
            // Check if user is clicking their own profile
            const isOwnClick = (profileData.phone && profileData.phone === auth.phone) || 
              (profileData.agencyName === auth.agencyName && profileData.city === auth.city);

            if (isOwnClick) {
              // Navigate to own full profile (no viewedProfile needed)
              setViewedProfile(null);
              setProfileTab('all');
              auth.setScreen('profile');
              return;
            }

            // For other users: fetch their full profile from Firebase
            try {
              let fullUser = null;

              // Try by phone first (most reliable)
              if (profileData.phone) {
                fullUser = await apiService.fetchUserByPhone(profileData.phone);
              }

              // Fallback: try by agencyName + city (works for old posts without phone)
              if (!fullUser && profileData.agencyName && profileData.city) {
                fullUser = await apiService.fetchUserByNameAndCity(profileData.agencyName, profileData.city);
              }

              if (fullUser) {
                setViewedProfile({
                  agencyName: fullUser.agencyName,
                  city: fullUser.city,
                  agencyLogo: fullUser.agencyLogo,
                  userType: fullUser.userType,
                  agencyType: fullUser.agencyType,
                  hotelCategory: fullUser.hotelCategory,
                  specializations: fullUser.specializations || [],
                  gstin: fullUser.gstin,
                  isVerified: fullUser.isVerified,
                  verificationStatus: fullUser.verificationStatus || 'none',
                  bio: fullUser.bio || '',
                  streetAddress: fullUser.streetAddress || '',
                  country: fullUser.country || '',
                  state: fullUser.state || '',
                  pincode: fullUser.pincode || '',
                  handlingPerson: fullUser.handlingPerson || '',
                  handlingPosition: fullUser.handlingPosition || '',
                  phone: fullUser.phone || '',
                  email: fullUser.email || '',
                  followers: fullUser.followers || [],
                  following: fullUser.following || []
                });
                setProfileTab('all');
                auth.setScreen('profile');
                return;
              }
            } catch (err) {
              console.error('Error fetching user profile:', err);
            }

            // Last resort fallback: use partial data from the post
            setViewedProfile(profileData);
            setProfileTab('all');
            auth.setScreen('profile');
          }}
          onOpenPostModal={() => feed.setInquiryModalVisible(true)}
          onActionMenu={(postItem) => {
            feed.setSelectedActionPost(postItem);
            feed.setActionMenuVisible(true);
          }}
          onChat={async (postItem) => {
            if (postItem.phone === auth.phone) {
              Alert.alert('Unable to Chat', 'This is your own listing.');
              return;
            }
            if (!postItem.phone) {
              Alert.alert('Unable to Chat', 'This listing does not have a contact number associated.');
              return;
            }
            try {
              const nameParts = postItem.agencyName.match(/^(.*?)\s*\((.*?)\)$/);
              const nameOnly = nameParts ? nameParts[1] : postItem.agencyName;
              const cityOnly = nameParts ? nameParts[2] : '';

              const targetUser = {
                phone: postItem.phone,
                agencyName: nameOnly,
                city: cityOnly,
                agencyLogo: postItem.agencyLogo || '💼',
                handlingPerson: postItem.handlingPerson || ''
              };

              const chatRoom = await apiService.startOrCreateChat(auth, targetUser);
              setActiveChat(chatRoom);
              auth.setScreen('chats');
            } catch (err) {
              console.error('Error starting chat:', err);
              Alert.alert('Chat Error', 'Could not open chat with this user.');
            }
          }}
          onComment={(postItem) => setActiveCommentPost(postItem)}
          onSave={handleSavePost}
          savedPosts={auth.savedPosts}
          onOpenNotifications={() => auth.setScreen('notifications')}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      ) : auth.screen === 'profile' ? (
        <ProfileScreen
          currentUser={auth}
          viewedProfile={viewedProfile}
          onGoBack={() => {
            setViewedProfile(null);
            auth.setScreen('feed');
          }}
          profileTab={profileTab}
          setProfileTab={setProfileTab}
          onEditProfile={profile.openProfileEditor}
          onChangeAvatar={profile.changeAvatarDirectly}
          onOpenSettings={() => auth.setScreen('settings')}
          onSelectGridPost={setSelectedGridPost}
          feedData={feed.feedData}
          onVerificationSubmitted={() => {
            auth.setCurrentVerificationStatus('applied');
          }}
        />
      ) : auth.screen === 'chats' ? (
        <ChatScreen
          onGoBack={() => {
            auth.setScreen('feed');
            setActiveChat(null);
          }}
          currentUser={auth}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
        />
      ) : auth.screen === 'settings' ? (
        <SettingsScreen
          currentUser={auth}
          onGoBack={() => auth.setScreen('profile')}
          onLogout={() => {
            auth.logout();
            setViewedProfile(null);
          }}
        />
      ) : auth.screen === 'notifications' ? (
        <NotificationsScreen
          onGoBack={() => auth.setScreen('feed')}
          currentUser={auth}
          onOpenPost={async (postId) => {
            try {
              const post = await apiService.fetchPostById(postId);
              if (post) {
                setSelectedGridPost(post);
              } else {
                Alert.alert("Unavailable", "This post may have been deleted.");
              }
            } catch (err) {
              console.error("Error opening post:", err);
            }
          }}
        />
      ) : null}

      {/* Floating Bottom Navigation Console (Only visible when logged in and not inside an active chat) */}
      {!activeChat && (
        <FloatingConsole
          screen={auth.screen}
          setScreen={auth.setScreen}
          setViewedProfile={setViewedProfile}
          setProfileTab={setProfileTab}
          feedHook={feed}
          totalUnread={totalUnread}
        />
      )}

      {/* MODAL 1: Write Post Overlay */}
      <PostModal
        visible={feed.inquiryModalVisible}
        onClose={() => feed.setInquiryModalVisible(false)}
        currentUser={auth}
        feedHook={feed}
      />

      {/* MODAL 2: Profile Editor Overlay */}
      <ProfileEditorModal
        visible={profile.profileModalVisible}
        onClose={() => profile.setProfileModalVisible(false)}
        profileHook={profile}
      />

      {/* MODAL 3: Grid Post Quick View Overlay */}
      <PostQuickViewModal
        post={selectedGridPost}
        onClose={() => setSelectedGridPost(null)}
      />

      {/* MODAL 4: Custom Action Menu Drawer (Delete/Report) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={feed.actionMenuVisible}
        onRequestClose={() => feed.setActionMenuVisible(false)}
      >
        <TouchableOpacity 
          style={[styles.modalOverlay, { justifyContent: 'center', alignItems: 'center' }]} 
          activeOpacity={1} 
          onPress={() => feed.setActionMenuVisible(false)}
        >
          <View style={styles.actionMenuContent}>
            <View style={styles.actionMenuBody}>
              <Text style={styles.actionMenuTitle}>Post Actions</Text>
              
              {feed.selectedActionPost && (
                <>
                  {/* Delete option only if the post belongs to the logged-in user */}
                  {(feed.selectedActionPost.agencyName === `${auth.agencyName} (${auth.city || 'India'})` || 
                    feed.selectedActionPost.agencyName === auth.agencyName) ? (
                    <TouchableOpacity 
                      style={styles.actionMenuItem}
                      onPress={() => {
                        feed.setActionMenuVisible(false);
                        feed.handleDeletePost(feed.selectedActionPost.id);
                      }}
                    >
                      <Text style={styles.actionMenuDeleteText}>Delete Post</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.actionMenuItem}
                      onPress={() => {
                        feed.setActionMenuVisible(false);
                        Alert.alert('Reported', 'Thank you for keeping our community safe. This listing has been flagged for admin review.');
                      }}
                    >
                      <Text style={styles.actionMenuReportText}>Report Listing</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity 
                style={[styles.actionMenuItem, styles.actionMenuCancel]}
                onPress={() => feed.setActionMenuVisible(false)}
              >
                <Text style={styles.actionMenuCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <CommentsModal
        visible={activeCommentPost !== null}
        post={activeCommentPost}
        onClose={() => setActiveCommentPost(null)}
        currentUser={auth}
        onCommentAdded={() => {
          // Socket handles the comment count update for everyone, including the sender
        }}
      />

      {/* In-App Notification Toast */}
      <InAppNotificationToast
        notification={inAppNotification}
        onPress={() => {
          // Navigate to the chat that triggered the notification
          if (inAppNotification?.chat) {
            setActiveChat(inAppNotification.chat);
          }
          auth.setScreen('chats');
          setInAppNotification(null);
        }}
        onDismiss={() => setInAppNotification(null)}
      />
      </View>
    </SafeAreaProvider>
  );
}
