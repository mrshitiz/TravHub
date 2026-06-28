import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { styles } from '../styles/themeStyles';
import { getAvatarSource, isImageUri } from '../utils/helpers';
import { apiService } from '../services/apiService';
import { notificationService } from '../services/notificationService';

export const ProfileScreen = ({
  currentUser,
  viewedProfile,
  onGoBack,
  profileTab,
  setProfileTab,
  onEditProfile,
  onChangeAvatar,
  onOpenSettings,
  onSelectGridPost,
  feedData,
  onVerificationSubmitted
}) => {
  const [followLoading, setFollowLoading] = useState(false);

  const profileInfo = viewedProfile || {
    ...currentUser,
    userType: currentUser.currentUserType,
    agencyType: currentUser.currentAgencyType,
    hotelCategory: currentUser.currentHotelCategory,
    specializations: currentUser.currentSpecializations,
    gstin: currentUser.currentGstin,
    isVerified: currentUser.currentUserVerified,
    verificationStatus: currentUser.currentVerificationStatus,
  };

  const isOwnProfile = !viewedProfile || 
    (viewedProfile.phone && currentUser.phone && viewedProfile.phone === currentUser.phone) ||
    (viewedProfile.agencyName === currentUser.agencyName && viewedProfile.city === currentUser.city);

  const profileFullAgencyName = `${profileInfo.agencyName} (${profileInfo.city})`;
  const profilePosts = feedData.filter(post => post.agencyName === profileFullAgencyName);

  // Followers / Following data
  const followersCount = (profileInfo.followers || []).length;
  const followingCount = (profileInfo.following || []).length;

  // Check if current user follows this profile
  const isFollowing = !isOwnProfile && 
    (currentUser.following || []).includes(profileInfo.phone);

  // Resolve category label for a post (plain text, no icons)
  const getCategoryLabel = (post) => {
    const cat = post.category || (post.type === 'b2c_inquiry' ? 'inquiry' : 'showcase');
    switch (cat) {
      case 'guidance': return 'Guidance';
      case 'showcase': return 'Showcase';
      default: return 'Inquiry';
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!profileInfo.phone || !currentUser.phone) return Alert.alert('Error', 'Unable to follow this user.');
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiService.unfollowUser(currentUser.phone, profileInfo.phone);
        currentUser.setFollowing((currentUser.following || []).filter(p => p !== profileInfo.phone));
        if (viewedProfile) viewedProfile.followers = (viewedProfile.followers || []).filter(p => p !== currentUser.phone);
      } else {
        await apiService.followUser(currentUser.phone, profileInfo.phone);
        currentUser.setFollowing([...(currentUser.following || []), profileInfo.phone]);
        if (viewedProfile) viewedProfile.followers = [...(viewedProfile.followers || []), currentUser.phone];
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error(err);
    }
    setFollowLoading(false);
  };

  // Filter based on selected tab
  const savedListings = feedData.filter(post => (currentUser.savedPosts || []).includes(post.id));
  const displayedProfilePosts = isOwnProfile && profileTab === 'saved' ? savedListings : profilePosts;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#050b14' }}>
      {/* App Header / Navigation Header */}
      <View style={styles.appHeader}>
        {!isOwnProfile ? (
          <TouchableOpacity 
            style={styles.headerIconLeft}
            onPress={onGoBack}
          >
            <Text style={styles.headerIconText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIconLeft} />
        )}
        <Text style={styles.headerLogoText}>
          <Text style={{ fontWeight: '300', color: '#ffffff' }}>trav</Text>
          <Text style={{ fontWeight: '900', color: '#0ea5e9' }}>hub</Text>
        </Text>
        {isOwnProfile ? (
          <TouchableOpacity 
            style={{ width: 32, alignItems: 'flex-end', justifyContent: 'center' }}
            onPress={onOpenSettings}
          >
            <Text style={{ fontSize: 24, color: '#ffffff' }}>☰</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.igProfileScroll}>
        {/* Main Profile Info Row */}
        <View style={styles.igProfileInfoContainer}>
          <View style={styles.igProfileAvatarContainer}>
            <TouchableOpacity 
              style={{ position: 'relative' }}
              disabled={!isOwnProfile}
              onPress={onChangeAvatar}
            >
              <View style={styles.igLargeAvatarCircle}>
                {profileInfo.agencyLogo && isImageUri(profileInfo.agencyLogo) ? (
                  <Image 
                    source={getAvatarSource(profileInfo.agencyLogo)} 
                    style={styles.igLargeAvatarImage} 
                    transition={200}
                    cachePolicy="memory-disk"
                    recyclingKey={profileInfo.agencyLogo}
                  />
                ) : (
                  <Text style={styles.igLargeAvatarEmoji}>{profileInfo.agencyLogo || '💼'}</Text>
                )}
              </View>
              {profileInfo.isVerified && (
                <View style={styles.igLargeAvatarVerifiedBadge}>
                  <Text style={styles.igLargeAvatarVerifiedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Company Name and Stats on the Right */}
          <View style={{ flex: 1, justifyContent: 'center', gap: 10 }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }}>{profileInfo.agencyName}</Text>
            
            {/* Stats Row: Posts · Followers · Following */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 10 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.profileStatCount}>{profilePosts.length}</Text>
                <Text style={styles.profileStatLabel}>Posts</Text>
              </View>
              <TouchableOpacity 
                style={{ alignItems: 'center' }}
                onPress={() => Alert.alert('Followers', `${followersCount} follower${followersCount !== 1 ? 's' : ''}`)}
              >
                <Text style={styles.profileStatCount}>{followersCount}</Text>
                <Text style={styles.profileStatLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ alignItems: 'center' }}
                onPress={() => Alert.alert('Following', `Following ${followingCount} account${followingCount !== 1 ? 's' : ''}`)}
              >
                <Text style={styles.profileStatCount}>{followingCount}</Text>
                <Text style={styles.profileStatLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Bio */}
        <View style={styles.igBioContainer}>
          {profileInfo.bio ? (
            <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '500', marginBottom: 4, lineHeight: 18, textAlign: 'justify' }}>{profileInfo.bio}</Text>
          ) : null}
        </View>

        {/* Business Details Card - Removed for cleaner UI */}

        <View style={{ paddingHorizontal: 16 }}>
          {isOwnProfile && currentUser.currentUserStatus === 'pending' && (
            <View style={[styles.gstinBadgeRow, { backgroundColor: 'rgba(234, 179, 8, 0.08)', borderColor: 'rgba(234, 179, 8, 0.25)', marginTop: 8 }]}>
              <Text style={{ color: '#eab308', fontSize: 11.5, fontWeight: '700' }}>⏳ Pending Admin Approval</Text>
            </View>
          )}

          {isOwnProfile && !profileInfo.isVerified && (
            <View style={{ marginTop: 8 }}>
              {profileInfo.verificationStatus === 'applied' ? (
                <View style={[styles.gstinBadgeRow, { backgroundColor: 'rgba(234, 179, 8, 0.08)', borderColor: 'rgba(234, 179, 8, 0.25)' }]}>
                  <Text style={{ color: '#eab308', fontSize: 11.5, fontWeight: '700' }}>⏳ Verification Submitted (Pending Approval)</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.igProfileBtn, { backgroundColor: 'rgba(14, 165, 233, 0.08)', borderColor: 'rgba(14, 165, 233, 0.3)', width: '100%', height: 32, paddingVertical: 0, justifyContent: 'center' }]}
                  onPress={async () => {
                    try {
                      await apiService.updateUserProfile(currentUser.phone, { verificationStatus: 'applied' });
                      Alert.alert('Verification Applied', 'Your verification request has been submitted to the admin panel for review.');
                      if (onVerificationSubmitted) onVerificationSubmitted();
                    } catch (err) {
                      Alert.alert('Error', err.message);
                    }
                  }}
                >
                  <Text style={[styles.igProfileBtnText, { color: '#0ea5e9', fontSize: 11 }]}>Apply for Verification Badge</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Profile Action Buttons */}
        <View style={styles.igProfileActionsRow}>
          {isOwnProfile ? (
            <TouchableOpacity 
              style={[styles.igProfileBtn, styles.igProfileBtnPrimary]}
              onPress={onEditProfile}
            >
              <Text style={styles.igProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[
                  styles.followBtn,
                  isFollowing && styles.followBtnActive
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                <Text style={[
                  styles.followBtnText,
                  isFollowing && styles.followBtnTextActive
                ]}>
                  {followLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
                </Text>
              </TouchableOpacity>
              <View style={{ width: 8 }} />
              <TouchableOpacity 
                style={styles.messageBtn}
                onPress={() => {
                  Alert.alert('Contacting Agent', `Opening chat with ${profileInfo.agencyName}...`);
                }}
              >
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Divider before grid */}
        <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginTop: 16 }} />

        {isOwnProfile && (
          <View style={styles.profileTabsContainer}>
            <TouchableOpacity 
              style={[styles.profileTabButton, profileTab === 'all' && styles.profileTabButtonActive]}
              onPress={() => setProfileTab('all')}
            >
              <Text style={[styles.profileTabText, profileTab === 'all' && styles.profileTabTextActive]}>My Posts ({profilePosts.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.profileTabButton, profileTab === 'saved' && styles.profileTabButtonActive]}
              onPress={() => setProfileTab('saved')}
            >
              <Text style={[styles.profileTabText, profileTab === 'saved' && styles.profileTabTextActive]}>Saved Listings ({savedListings.length})</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grid Posts — All posts, uniform design */}
        {displayedProfilePosts.length === 0 ? (
          <View style={styles.igEmptyGridContainer}>
            <Text style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>{profileTab === 'saved' ? '🔖' : '📷'}</Text>
            <Text style={styles.igEmptyGridText}>
              {profileTab === 'saved' ? 'No saved listings yet.' : 'No posts yet.'}
            </Text>
          </View>
        ) : (
          <View style={styles.igGridContainer}>
            {displayedProfilePosts.map((post) => {
              const hasImage = (post.images && post.images.length > 0) || post.image;
              const categoryLabel = getCategoryLabel(post);
              const displayTitle = post.title
                ? post.title
                    .replace(/^(✈️|🔍|💡|✨)\s*(B2B Offer|Inquiry|Requirement|Guidance|Showcase):\s*/i, '')
                    .replace(/^(✈️|🔍|💡|✨)\s*/, '')
                : 'Explore';

              return (
                <TouchableOpacity 
                  key={post.id} 
                  style={styles.igGridCell}
                  onPress={() => onSelectGridPost(post)}
                >
                  {hasImage ? (
                    /* Image card — clean with subtle category text at bottom */
                    <View style={styles.profileGridCard}>
                      <Image 
                        source={{ uri: post.images ? post.images[0] : post.image }} 
                        style={styles.profileGridCardImage} 
                        transition={200}
                        cachePolicy="disk"
                      />
                      <View style={styles.profileGridCardOverlay}>
                        <Text style={styles.profileGridCardLabel}>
                          {categoryLabel}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    /* Text-only card — clean, neutral, professional */
                    <View style={styles.profileGridCardText}>
                      <View>
                        <Text numberOfLines={3} style={styles.profileGridCardTitle}>
                          {displayTitle}
                        </Text>
                        {post.description ? (
                          <Text numberOfLines={2} style={styles.profileGridCardDesc}>
                            {post.description}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.profileGridCardFooter}>
                        <Text style={styles.profileGridCardFooterText}>
                          {categoryLabel}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
