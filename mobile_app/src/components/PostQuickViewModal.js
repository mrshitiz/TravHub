import React from 'react';
import { Modal, View, ScrollView, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { styles } from '../styles/themeStyles';
import { isImageUri, getAvatarSource } from '../utils/helpers';
import ImageCarousel from './ImageCarousel';

export const PostQuickViewModal = ({
  post,
  onClose,
}) => {
  if (!post) return null;

  const modalDest = post.title && post.title.includes(':') 
    ? post.title.split(':').slice(1).join(':').trim() 
    : (post.tags && post.tags[0] ? post.tags[0] : 'Explore');
  const modalIsB2B = post.type === 'b2b_ad';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={post !== null}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.igCard, { borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 450 }]}>
          {/* Header */}
          <View style={styles.igCardHeader}>
            <View style={styles.igHeaderLeft}>
              <View style={[styles.avatarCircle, post.type === 'b2b_ad' ? styles.avatarB2B : styles.avatarB2C]}>
                {post.agencyLogo && isImageUri(post.agencyLogo) ? (
                  <Image source={getAvatarSource(post.agencyLogo)} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarEmoji}>{post.agencyLogo || '💼'}</Text>
                )}
              </View>
              <View>
                <View style={styles.authorRow}>
                  <Text style={styles.igAuthorName}>{post.agencyName.replace(/\s*\(.*?\)/g, '')}</Text>
                  {post.isVerified && (
                    <Text style={styles.verifiedBadge}>✓</Text>
                  )}
                </View>
                <Text style={styles.igTime}>{post.time}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Title & Description */}
          <ScrollView style={{ maxHeight: 200, padding: 14 }}>
            <Text style={styles.igCardTitle}>{post.title}</Text>
            <Text style={styles.igCardDescription}>{post.description}</Text>
          </ScrollView>

          {/* Render Images/Carousel */}
          {post.images && post.images.length > 0 ? (
            <ImageCarousel images={post.images} />
          ) : (
            post.image ? (
              <Image source={{ uri: post.image }} style={styles.igMediaImage} />
            ) : (
              <View style={[styles.igLightCard, { marginHorizontal: 14, marginBottom: 14 }]}>
                <View style={[styles.igLightCardAccent, modalIsB2B ? styles.bgB2B : styles.bgB2C]} />
                <View style={styles.igLightCardBody}>
                  <View style={styles.igLightCardHeader}>
                    <Text style={styles.igLightCardLabel}>
                      {modalIsB2B ? '🎫 B2B OFFER TICKET' : '✈️ TRAVEL REQUIREMENT'}
                    </Text>
                    <Text style={styles.igLightCardTag}>
                      #{modalDest.replace(/\s+/g, '')}
                    </Text>
                  </View>
                  <Text style={styles.igLightCardDest}>{modalDest}</Text>
                  <Text style={[styles.igLightCardPrice, modalIsB2B ? styles.textB2B : styles.textB2C]}>
                    {post.price}
                  </Text>
                </View>
              </View>
            )
          )}

          {/* Budget/Price & Tags */}
          <View style={styles.igStatPanel}>
            <Text style={[styles.igPriceText, post.type === 'b2b_ad' ? styles.priceTeal : styles.priceOrange]}>
              {post.price}
            </Text>
            <View style={styles.tagRow}>
              {post.tags && post.tags.map((tag, idx) => (
                <Text key={idx} style={styles.igTag}>#{tag}</Text>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.igActionBar, { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }]}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              ❤️ {post.likes || 0} Likes • 💬 {post.comments || 0} Answers
            </Text>
            <TouchableOpacity 
              style={[styles.actionButton, styles.whatsappButton]}
              onPress={() => {
                Alert.alert('Chatting with Agent', 'Opening WhatsApp...');
              }}
            >
              <Text style={styles.whatsappButtonText}>WhatsApp Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PostQuickViewModal;
