import React from 'react';
import { Modal, TouchableWithoutFeedback, View, Keyboard, Text, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { styles } from '../styles/themeStyles';

export const PostModal = ({
  visible,
  onClose,
  currentUser,
  feedHook,
}) => {
  if (!currentUser) return null;
  const isPending = currentUser.currentUserStatus === 'pending';
  const isB2B = currentUser.currentUserType === 'hotel' || currentUser.currentAgencyType === 'b2b';

  // Dynamic texts based on category/mode
  let modalHeading = 'Publish B2B Deal / Offer';
  let destLabel = 'Itinerary / Destination Title';
  let destPlaceholder = 'e.g. 5D Bali Land Package, Kashmir Deluxe Itinerary';
  let detailsLabel = 'Package Description (Inclusions, Dates, Itinerary)';
  let detailsPlaceholder = 'e.g. Hotel stay, breakfast, transfers, visa assistance included. Minimum booking size 4 Pax...';

  if (!isB2B) {
    if (feedHook.newPostCategory === 'guidance') {
      modalHeading = 'Ask for Travel Guidance';
      detailsLabel = 'Guidance Needed / Travel Question';
      detailsPlaceholder = 'e.g. What is the current visa fee for Indians? Are hotels fully booked in Shimla right now?';
    } else if (feedHook.newPostCategory === 'showcase') {
      modalHeading = 'Showcase Travel / Update';
      detailsLabel = 'Travel Story / Update Details';
      detailsPlaceholder = 'e.g. Describe your travel experience, key tour highlights, or share business updates...';
    } else {
      modalHeading = 'Post Client Inquiry';
      detailsLabel = 'Inquiry Details (Pax, Star, dates, etc.)';
      detailsPlaceholder = 'e.g. Need 4N hotel in Munnar, 2 Adults 1 Child, transfer by cab, flight options if available...';
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={Keyboard.dismiss}>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
              {isPending ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 50, marginBottom: 15 }}>⏳</Text>
                  <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 10 }]}>Verification Pending</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                    Your business account is currently undergoing credential review. Only verified B2B suppliers and approved partners can publish listings. B2C agents do not require review.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.modalBtnCancel, { width: '100%', height: 48, justifyContent: 'center', alignItems: 'center' }]} 
                    onPress={onClose}
                  >
                    <Text style={styles.modalBtnCancelText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.modalTitle}>{modalHeading}</Text>

                  {!isB2B && (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={styles.modalLabel}>Post Category</Text>
                      <View style={styles.categoryTabsContainer}>
                        <TouchableOpacity 
                          style={[styles.categoryTab, feedHook.newPostCategory === 'inquiry' && styles.categoryTabActive]}
                          onPress={() => feedHook.setNewPostCategory('inquiry')}
                        >
                          <Text style={[styles.categoryTabText, feedHook.newPostCategory === 'inquiry' && styles.categoryTabTextActive]}>🔍 Inquiry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.categoryTab, feedHook.newPostCategory === 'guidance' && styles.categoryTabActive]}
                          onPress={() => feedHook.setNewPostCategory('guidance')}
                        >
                          <Text style={[styles.categoryTabText, feedHook.newPostCategory === 'guidance' && styles.categoryTabTextActive]}>💡 Guidance</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.categoryTab, feedHook.newPostCategory === 'showcase' && styles.categoryTabActive]}
                          onPress={() => feedHook.setNewPostCategory('showcase')}
                        >
                          <Text style={[styles.categoryTabText, feedHook.newPostCategory === 'showcase' && styles.categoryTabTextActive]}>✨ Showcase</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  
                  {isB2B && (
                    <>
                      <Text style={styles.modalLabel}>{destLabel}</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder={destPlaceholder}
                        placeholderTextColor="#9ca3af"
                        value={feedHook.newDestination}
                        onChangeText={feedHook.setNewDestination}
                      />
                    </>
                  )}

                  <Text style={styles.modalLabel}>{detailsLabel}</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputTextarea]}
                    placeholder={detailsPlaceholder}
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    value={feedHook.newDetails}
                    onChangeText={feedHook.setNewDetails}
                  />

                  {isB2B && (
                    <>
                      <Text style={styles.modalLabel}>Special B2B Price (INR ₹)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 35,000 total"
                        placeholderTextColor="#9ca3af"
                        value={feedHook.newBudget}
                        onChangeText={feedHook.setNewBudget}
                        keyboardType="number-pad"
                      />
                    </>
                  )}

                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.modalLabel}>
                      {isB2B ? 'Campaign Photos (Multiple Supported, Square Aspect)' : 'Add Photos (Optional, Multiple Supported)'}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.uploadBtn, { marginTop: 4 }]} 
                      onPress={feedHook.pickPostImages}
                    >
                      <Text style={styles.uploadBtnText}>📸 Pick Photos from Gallery</Text>
                    </TouchableOpacity>
                    {feedHook.newPostImages.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {feedHook.newPostImages.map((uri, idx) => (
                          <View key={idx} style={{ position: 'relative', marginRight: 10 }}>
                            <Image 
                              source={{ uri }} 
                              style={{ width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} 
                            />
                            <TouchableOpacity 
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                backgroundColor: '#ef4444',
                                borderRadius: 10,
                                width: 20,
                                height: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: '#ffffff'
                              }}
                              onPress={() => feedHook.setNewPostImages(feedHook.newPostImages.filter((_, i) => i !== idx))}
                            >
                              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  <View style={styles.modalActionGroup}>
                    <TouchableOpacity 
                      style={[styles.modalBtn, styles.modalBtnCancel]} 
                      onPress={onClose}
                    >
                      <Text style={styles.modalBtnCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalBtn, styles.modalBtnSubmit, isB2B && { backgroundColor: '#0ea5e9' }]} 
                      onPress={feedHook.handleAddPost}
                    >
                      <Text style={styles.modalBtnSubmitText}>Publish</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

export default PostModal;
