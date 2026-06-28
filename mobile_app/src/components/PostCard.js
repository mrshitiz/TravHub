import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { styles } from '../styles/themeStyles';
import { isImageUri, getAvatarSource } from '../utils/helpers';
import Avatar from './Avatar';
import ImageCarousel from './ImageCarousel';
import { CommentOutlineIcon, ForumIcon, BookmarkIcon, WhatsAppIcon } from './SvgIcons';

export const PostCard = ({ 
  item, 
  onViewProfile, 
  onDeletePost, 
  onActionMenu, 
  onChat, 
  onComment, 
  onSave, 
  isSaved 
}) => {
  const isB2B = item.type === 'b2b_ad';
  const isHotel = item.userType === 'hotel';
  const cleanAgencyName = item.agencyName ? item.agencyName.replace(/\s*\(.*?\)/g, '') : '';
  
  // Resolve post category type
  const categoryType = isB2B 
    ? 'b2b' 
    : (item.category 
        ? item.category 
        : (item.title && (item.title.includes('💡') || item.title.includes('Guidance')) 
            ? 'guidance' 
            : (item.title && (item.title.includes('✨') || item.title.includes('Showcase')) ? 'showcase' : 'inquiry')));

  // Resolve color indicator dot and badge style
  let dotStyle = styles.bgB2C;
  let labelTextStyle = styles.textB2C;
  let categoryLabel = 'Inquiry';

  if (categoryType === 'b2b') {
    dotStyle = styles.bgB2B;
    labelTextStyle = styles.textB2B;
    categoryLabel = 'B2B Offer';
  } else if (categoryType === 'guidance') {
    dotStyle = styles.bgGuidance;
    labelTextStyle = styles.textGuidance;
    categoryLabel = 'Guidance';
  } else if (categoryType === 'showcase') {
    dotStyle = styles.bgShowcase;
    labelTextStyle = styles.textShowcase;
    categoryLabel = 'Showcase';
  }

  // Clean up title
  const displayTitle = item.title
    ? item.title
        .replace(/^(✈️|🔍|💡|✨)\s*(B2B Offer|Inquiry|Requirement|Guidance|Showcase):\s*/i, '')
        .replace(/^(✈️|🔍|💡|✨)\s*/, '')
    : 'Explore';

  // Header Background Styling based on user type
  let headerStyle = [styles.igCardHeader];
  if (isB2B) {
    headerStyle.push(styles.headerB2B);
  } else if (isHotel) {
    headerStyle.push(styles.headerHotel);
  }

  return (
    <View style={[styles.igCard, isB2B && { borderColor: 'rgba(245, 158, 11, 0.4)', borderWidth: 1.5 }]}>
      {/* Card Header (Instagram style with dynamic header colors) */}
      <View style={headerStyle}>
        <TouchableOpacity 
          style={styles.igHeaderLeft}
          onPress={() => {
            const nameParts = item.agencyName.match(/^(.*?)\s*\((.*?)\)$/);
            const nameOnly = nameParts ? nameParts[1] : item.agencyName;
            const cityOnly = nameParts ? nameParts[2] : '';

            onViewProfile({
              agencyName: nameOnly,
              city: cityOnly,
              agencyLogo: item.agencyLogo,
              userType: item.userType,
              agencyType: item.agencyType,
              hotelCategory: item.hotelCategory,
              specializations: item.specializations || [],
              gstin: item.gstin,
              isVerified: item.isVerified,
              verificationStatus: item.verificationStatus || (item.isVerified ? 'verified' : 'none'),
              bio: item.bio || '',
              streetAddress: item.streetAddress || '',
              country: item.country || '',
              state: item.state || '',
              pincode: item.pincode || '',
              handlingPerson: item.handlingPerson || '',
              handlingPosition: item.handlingPosition || '',
              phone: item.phone || '',
              email: item.email || ''
            });
          }}
        >
          <View style={{ position: 'relative' }}>
            <View style={[styles.avatarCircle, isB2B ? styles.avatarB2B : styles.avatarB2C]}>
              <Avatar logo={item.agencyLogo} size={48} />
            </View>
            {item.isVerified && (
              <View style={styles.avatarVerifiedBadge}>
                <Text style={styles.avatarVerifiedText}>✓</Text>
              </View>
            )}
          </View>
          <View>
            <View style={styles.authorRow}>
              <Text style={styles.igAuthorName}>{cleanAgencyName}</Text>
              {isB2B && (
                <>
                  <View style={[styles.typeIndicatorDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={[styles.typeIndicatorText, { color: '#f59e0b', fontWeight: '800' }]}>
                    B2B DEAL
                  </Text>
                </>
              )}
              {/* Only display category badge for B2C Inquiry / Showcase / Guidance posts */}
              {!isB2B && !isHotel && (
                <>
                  <View style={[styles.typeIndicatorDot, dotStyle]} />
                  <Text style={[styles.typeIndicatorText, labelTextStyle]}>
                    {categoryLabel}
                  </Text>
                </>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={styles.igTime}>{item.time}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deletePostBtn}
          onPress={() => {
            onActionMenu(item);
          }}
        >
          <Text style={[styles.deletePostBtnText, { fontSize: 20, fontWeight: '700', paddingHorizontal: 4, color: '#ffffff' }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Card Title & Content */}
      <View style={styles.igCardContent}>
        {isB2B && <Text style={styles.igCardTitle}>{displayTitle}</Text>}
        <Text style={styles.igCardDescription}>{item.description}</Text>
      </View>

      {/* Optional Campaign Media (Instagram Image style for B2B ads & B2C inquiries with images) */}
      {item.images && item.images.length > 0 ? (
        <ImageCarousel images={item.images} />
      ) : (
        item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.igMediaImage} 
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : null
      )}

      {/* Interactive Stats Panel (Only show budget/price for B2B Offer posts) */}
      {isB2B && item.price ? (
        <View style={styles.igStatPanel}>
          <Text style={[styles.igPriceText, styles.priceTeal]}>
            {item.price}
          </Text>
        </View>
      ) : null}

      {/* Action Bar (Instagram style like, comment buttons) */}
      <View style={styles.igActionBar}>
        <View style={styles.actionIconsLeft}>
          {/* 1. Comment on Post (visible to all) */}
          <TouchableOpacity 
            style={styles.actionIconButton} 
            onPress={() => onComment && onComment(item)}
            activeOpacity={0.7}
          >
            <CommentOutlineIcon size={20} color="#9ca3af" />
            <Text style={styles.actionIconLabel}>{item.comments || 0}</Text>
          </TouchableOpacity>

          {/* 2. Chat with Poster (Direct message) */}
          <TouchableOpacity 
            style={styles.actionIconButton} 
            onPress={() => onChat && onChat(item)}
            activeOpacity={0.7}
          >
            <ForumIcon size={20} color="#9ca3af" />
            <Text style={styles.actionIconLabel}>Chat</Text>
          </TouchableOpacity>

          {/* 3. Save/Bookmark */}
          <TouchableOpacity 
            style={styles.actionIconButton} 
            onPress={() => onSave && onSave(item)}
            activeOpacity={0.7}
          >
            <BookmarkIcon size={20} color={isSaved ? "#0ea5e9" : "#9ca3af"} filled={isSaved} />
            <Text style={[styles.actionIconLabel, isSaved && { color: '#0ea5e9' }]}>
              {isSaved ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* WhatsApp Quote Button - Styled professionally, clean slate outline */}
        <TouchableOpacity 
          style={styles.cleanWhatsappBtn}
          onPress={() => {
            const contactPhone = item.phone || '';
            const msg = `Hi, I saw your post "${displayTitle}" on TravHub and would like to get a quote.`;
            const url = `whatsapp://send?phone=${contactPhone.startsWith('+') ? contactPhone : '+91' + contactPhone}&text=${encodeURIComponent(msg)}`;
            import('react-native').then(({ Linking }) => {
              Linking.openURL(url).catch(() => {
                import('react-native').then(({ Alert }) => {
                  Alert.alert('Unable to Open WhatsApp', 'Please make sure WhatsApp is installed on your device.');
                });
              });
            });
          }}
          activeOpacity={0.7}
        >
          <WhatsAppIcon size={14} color="#9ca3af" style={{ marginRight: 4 }} />
          <Text style={styles.cleanWhatsappBtnText}>WhatsApp Quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;
