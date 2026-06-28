import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles/themeStyles';
import { HomeIcon, BriefcaseIcon, ChatBubbleIcon, PersonIcon } from './SvgIcons';

export const FloatingConsole = ({ screen, setScreen, setViewedProfile, setProfileTab, feedHook, totalUnread }) => {
  const insets = useSafeAreaInsets();
  const currentFeedType = feedHook ? feedHook.feedType : 'all';
  const isFeedScreen = screen === 'feed';
  const isChatsScreen = screen === 'chats';
  const isProfileScreen = screen === 'profile';

  // Dynamically sit above the device home indicator / gesture nav bar
  const bottomOffset = Math.max(insets.bottom + 8, 16);

  // Cap badge display at 99+
  const badgeCount = totalUnread > 99 ? '99+' : totalUnread > 0 ? String(totalUnread) : null;

  return (
    <View style={[styles.floatingBottomConsole, { bottom: bottomOffset }]}>
      {/* Home (All Feed) */}
      <TouchableOpacity 
        style={[styles.consoleTab, (isFeedScreen && currentFeedType === 'all') && styles.consoleTabActive]}
        onPress={() => {
          if (setViewedProfile) setViewedProfile(null);
          if (feedHook) feedHook.setFeedType('all');
          setScreen('feed');
        }}
      >
        <HomeIcon active={isFeedScreen && currentFeedType === 'all'} />
        <Text style={[styles.consoleText, (isFeedScreen && currentFeedType === 'all') && styles.consoleTextActive]}>Home</Text>
      </TouchableOpacity>

      {/* B2B Feed */}
      <TouchableOpacity 
        style={[styles.consoleTab, (isFeedScreen && currentFeedType === 'b2b') && styles.consoleTabActive]}
        onPress={() => {
          if (setViewedProfile) setViewedProfile(null);
          if (feedHook) feedHook.setFeedType('b2b');
          setScreen('feed');
        }}
      >
        <BriefcaseIcon active={isFeedScreen && currentFeedType === 'b2b'} />
        <Text style={[styles.consoleText, (isFeedScreen && currentFeedType === 'b2b') && styles.consoleTextActive]}>B2B Feed</Text>
      </TouchableOpacity>
      
      {/* Chats — with unread count badge */}
      <TouchableOpacity 
        style={[styles.consoleTab, isChatsScreen && styles.consoleTabActive]}
        onPress={() => {
          if (setViewedProfile) setViewedProfile(null);
          setScreen('chats');
        }}
      >
        {/* Icon + badge wrapper */}
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <ChatBubbleIcon active={isChatsScreen} />
          {badgeCount && (
            <View
              style={{
                position: 'absolute',
                top: -6,
                right: -10,
                backgroundColor: '#ef4444',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 4,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: '#0a1628',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800', lineHeight: 12 }}>
                {badgeCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.consoleText, isChatsScreen && styles.consoleTextActive]}>Chats</Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity 
        style={[styles.consoleTab, isProfileScreen && styles.consoleTabActive]}
        onPress={() => {
          if (setViewedProfile) setViewedProfile(null);
          if (setProfileTab) setProfileTab('all');
          setScreen('profile');
        }}
      >
        <PersonIcon active={isProfileScreen} />
        <Text style={[styles.consoleText, isProfileScreen && styles.consoleTextActive]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FloatingConsole;
