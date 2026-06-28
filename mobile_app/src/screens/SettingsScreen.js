import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/themeStyles';
import { notificationService } from '../services/notificationService';
import { apiService } from '../services/apiService';
export const SettingsScreen = ({ currentUser, onGoBack, onLogout }) => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      const isOptedOut = localStorage.getItem('pushOptOut') === 'true';
      setPushEnabled(!isOptedOut && Notification.permission === 'granted');
    }
  }, []);

  const handlePushToggle = async (value) => {
    if (isToggling) return;
    setIsToggling(true);
    
    if (value) {
      // Attempt to enable
      try {
        const token = await notificationService.registerForPushNotificationsAsync(currentUser.phone);
        if (token) {
          if (Platform.OS === 'web') localStorage.setItem('pushOptOut', 'false');
          setPushEnabled(true);
        } else {
          Alert.alert('Notice', 'Push notifications could not be enabled. Please check your browser or device permissions.');
        }
      } catch (e) {
        Alert.alert('Error', 'Something went wrong while enabling notifications.');
      }
    } else {
      // Attempt to disable
      try {
        const success = await notificationService.unsubscribeFromPushNotificationsAsync(currentUser.phone);
        if (success) {
          if (Platform.OS === 'web') localStorage.setItem('pushOptOut', 'true');
          setPushEnabled(false);
        } else {
          Alert.alert('Notice', 'Could not disable notifications.');
        }
      } catch (e) {
        Alert.alert('Error', 'Something went wrong while disabling notifications.');
      }
    }
    
    setIsToggling(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to log out?")) {
        onLogout();
      }
    } else {
      Alert.alert(
        "Log Out",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log Out", onPress: onLogout, style: 'destructive' }
        ]
      );
    }
  };

  // UI Helper for Settings Section Header
  const SectionHeader = ({ title }) => (
    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginTop: 24, marginBottom: 8, paddingHorizontal: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {title}
    </Text>
  );

  // UI Helper for a Settings Row
  const SettingsRow = ({ icon, title, rightElement, onPress, isDestructive, hideBorder }) => (
    <TouchableOpacity 
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 14, 
        paddingHorizontal: 16,
        backgroundColor: '#0f172a',
        borderBottomWidth: hideBorder ? 0 : 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)'
      }}
      disabled={!onPress}
      onPress={onPress}
    >
      <View style={{ width: 32, alignItems: 'center', marginRight: 12 }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={{ flex: 1, color: isDestructive ? '#ef4444' : '#e2e8f0', fontSize: 16, fontWeight: isDestructive ? '600' : '400' }}>
        {title}
      </Text>
      {rightElement ? (
        rightElement
      ) : onPress ? (
        <Text style={{ color: '#64748b', fontSize: 18 }}>›</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#050b14' }}>
      <View style={[styles.appHeader, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
        <TouchableOpacity style={styles.headerIconLeft} onPress={onGoBack}>
          <Text style={styles.headerIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerLogoText}>
          <Text style={{ fontWeight: '600', color: '#ffffff', fontSize: 18 }}>Settings</Text>
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        <SectionHeader title="Account" />
        
        <View style={{ backgroundColor: '#0f172a', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' }}>
          <SettingsRow 
            icon="🛡️" 
            title={currentUser.isVerified ? "Verified Account" : currentUser.verificationStatus === 'applied' ? "Verification Pending" : "Apply for Verification"} 
            hideBorder={true}
            onPress={async () => {
              if (currentUser.isVerified) {
                Alert.alert("Verified", "Your account is already verified.");
                return;
              }
              if (currentUser.verificationStatus === 'applied') {
                Alert.alert("Pending", "Your verification request is currently under review.");
                return;
              }
              try {
                await apiService.updateUserProfile(currentUser.phone, { verificationStatus: 'applied' });
                // We update currentUser locally so the UI updates
                currentUser.verificationStatus = 'applied'; 
                Alert.alert('Verification Applied', 'Your verification request has been submitted for review.');
              } catch (err) {
                Alert.alert('Error', err.message);
              }
            }}
          />
        </View>
        
        <SectionHeader title="Preferences" />
        
        <View style={{ backgroundColor: '#0f172a', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' }}>
          <SettingsRow 
            icon="🔔" 
            title="Push Notifications" 
            hideBorder={true}
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={handlePushToggle}
                disabled={isToggling}
                trackColor={{ false: '#334155', true: '#0ea5e9' }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : pushEnabled ? '#ffffff' : '#94a3b8'}
              />
            }
          />
        </View>

        <SectionHeader title="Support & About" />
        
        <View style={{ backgroundColor: '#0f172a', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' }}>
          <SettingsRow 
            icon="❓" 
            title="Help Center" 
            onPress={() => Alert.alert("Coming Soon", "Help Center is under construction.")} 
          />
          <SettingsRow 
            icon="🔒" 
            title="Privacy Policy" 
            onPress={() => Alert.alert("Coming Soon", "Privacy Policy is under construction.")} 
          />
          <SettingsRow 
            icon="📄" 
            title="Terms of Service" 
            onPress={() => Alert.alert("Coming Soon", "Terms of Service is under construction.")} 
            hideBorder={true}
          />
        </View>

        <SectionHeader title="Login" />
        
        <View style={{ backgroundColor: '#0f172a', borderRadius: 12, marginHorizontal: 16, overflow: 'hidden' }}>
          <SettingsRow 
            icon="🚪" 
            title="Log Out" 
            onPress={handleLogout} 
            isDestructive={true} 
            hideBorder={true}
          />
        </View>

        <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>TravHub for Agents</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Version 1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
