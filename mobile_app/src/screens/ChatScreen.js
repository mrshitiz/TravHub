/* eslint-disable max-lines */
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Linking,
  Modal,
  Switch,
  Alert,
  TouchableHighlight
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { EditIcon, DeleteIcon } from '../components/SvgIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { styles } from '../styles/themeStyles';
import { apiService } from '../services/apiService';
import { isImageUri, getAvatarSource, compressImageNative } from '../utils/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationService } from '../services/notificationService';

export const ChatScreen = ({ onGoBack, currentUser, activeChat, setActiveChat }) => {
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const flatListRef = useRef(null);
  const isPickingRef = useRef(false);
  const markedReadRef = useRef(null); // tracks which chatId we already marked as read

  // Attachment and UI picking states
  const [isPicking, setIsPicking] = useState(false);
  const [sendingAttachment, setSendingAttachment] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [partnerProfiles, setPartnerProfiles] = useState({});

  // Subscribe to all chat partners' profiles to update UI in real-time (and fix local URIs/updated details)
  useEffect(() => {
    if (chats.length === 0 || !currentUser?.phone) {
      return;
    }

    const partnerPhones = [...new Set(
      chats.map(chat => chat.participants.find(p => p !== currentUser.phone)).filter(Boolean)
    )];

    if (partnerPhones.length === 0) return;

    const unsubscribe = apiService.subscribeToUserProfiles(
      partnerPhones,
      (profilesMap) => {
        setPartnerProfiles(prev => ({ ...prev, ...profilesMap }));
      },
      (err) => {
        console.error('Error subscribing to partner profiles:', err);
      }
    );

    return () => unsubscribe();
  }, [chats, currentUser?.phone]);

  // Subscribe to all chat rooms for the logged-in user
  useEffect(() => {
    if (!currentUser || !currentUser.phone) {
      setLoading(false);
      return;
    }

    const unsubscribe = apiService.subscribeToChats(
      currentUser.phone,
      (chatsList) => {
        setChats(chatsList);
        setLoading(false);

        // Mark incoming messages as received when they load in the chats list
        chatsList.forEach(chat => {
          if (chat.unread && chat.lastSender !== currentUser.phone) {
            const partnerPhone = chat.participants.find(p => p !== currentUser.phone);
            if (partnerPhone) {
              apiService.markMessagesAsReceived(chat.id, partnerPhone);
            }
          }
        });
      },
      (err) => {
        console.error('Error subscribing to chats:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.phone]);

  // Subscribe to messages if a chat is active
  useEffect(() => {
    if (!activeChat || !activeChat.id) {
      setMessages([]);
      return;
    }

    // Reset the "already marked read" tracker for the newly opened chat
    markedReadRef.current = null;

    setLoadingMessages(true);
    const unsubscribe = apiService.subscribeToMessages(
      activeChat.id,
      (msgList) => {
        setMessages(msgList);
        setLoadingMessages(false);

        // Mark messages as read from partner
        const partnerPhone = activeChat.participants.find(p => p !== currentUser?.phone);
        if (partnerPhone) {
          apiService.markMessagesAsRead(activeChat.id, partnerPhone);
        }

        // Mark the chat room as read ONLY ONCE when we first open it
        // (not on every incoming message, which would reset unreadCount to 0 repeatedly)
        if (markedReadRef.current !== activeChat.id) {
          markedReadRef.current = activeChat.id;
          
          const latestMsg = msgList.length > 0 ? msgList[0] : null;
          // Use latestMsg.sender or senderPhone (from our mapped msgList) or fallback to activeChat.lastSender
          const actualLastSender = latestMsg ? (latestMsg.sender || latestMsg.senderPhone) : activeChat.lastSender;

          if (actualLastSender && actualLastSender !== currentUser?.phone) {
            apiService.markChatAsRead(activeChat.id, currentUser.phone);
            setChats(prev => prev.map(c => 
              c.id === activeChat.id ? { ...c, unread: false, unreadCount: 0 } : c
            ));
          }
        }

        // Scroll to end when messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (err) => {
        console.error('Error subscribing to messages:', err);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [activeChat, currentUser?.phone]);

  const handleSend = async () => {
    if (!messageText.trim() || !activeChat || !activeChat.id || !currentUser || !currentUser.phone) {
      return;
    }

    const textToSend = messageText.trim();
    setMessageText('');

    try {
      if (editingMessageId) {
        await apiService.editMessage(activeChat.id, editingMessageId, textToSend);
        setEditingMessageId(null);
      } else {
        await apiService.sendMessage(activeChat.id, currentUser.phone, textToSend);
        
        // Send push notification to the partner
        const partnerPhone = activeChat.participants.find(p => p !== currentUser.phone);
        if (partnerPhone && partnerProfiles[partnerPhone] && partnerProfiles[partnerPhone].expoPushToken) {
           const senderName = currentUser.agencyName || 'New Message';
           notificationService.sendPushNotification(
             partnerProfiles[partnerPhone].expoPushToken, 
             senderName, 
             textToSend, 
             { chatId: activeChat.id }
           );
        }
      }
    } catch (err) {
      console.error('Error sending/editing message:', err);
    }
  };

  const handlePickImage = async () => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    setIsPicking(true);

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need photo library permissions to select images.');
        isPickingRef.current = false;
        setIsPicking(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.4,
      });

      // Close modal after selection resolves
      setAttachmentMenuVisible(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSendingAttachment(true);

        const compressedUri = await compressImageNative(asset.uri);
        const fileName = asset.fileName ? asset.fileName.replace(/\.[^/.]+$/, "") + ".webp" : `image_${Date.now()}.webp`;
        const downloadUrl = await apiService.uploadImage(compressedUri);

        await apiService.sendMessage(activeChat.id, currentUser.phone, '', {
          fileUrl: downloadUrl,
          fileName: fileName,
          fileSize: asset.fileSize || 0,
          fileType: 'image'
        });
      }
    } catch (err) {
      console.error('Error selecting image:', err);
      Alert.alert('Error', 'Could not select or upload the image.');
    } finally {
      setSendingAttachment(false);
      isPickingRef.current = false;
      setIsPicking(false);
    }
  };

  const handlePickPDF = async () => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    setIsPicking(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      // Close modal after selection resolves
      setAttachmentMenuVisible(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // 10MB Limit Check
        const sizeInMb = (asset.size || 0) / (1024 * 1024);
        if (sizeInMb > 10) {
          Alert.alert('File Too Large', `The selected PDF is ${sizeInMb.toFixed(2)}MB. The maximum size allowed is 10MB.`);
          isPickingRef.current = false;
          setIsPicking(false);
          return;
        }

        setSendingAttachment(true);
        const downloadUrl = await apiService.uploadImage(asset.uri);

        await apiService.sendMessage(activeChat.id, currentUser.phone, '', {
          fileUrl: downloadUrl,
          fileName: asset.name,
          fileSize: asset.size || 0,
          fileType: 'pdf'
        });
      }
    } catch (err) {
      console.error('Error selecting PDF:', err);
      Alert.alert('Error', 'Could not select or upload the PDF.');
    } finally {
      setSendingAttachment(false);
      isPickingRef.current = false;
      setIsPicking(false);
    }
  };

  // Render individual chat threads in the conversation list
  const renderChatItem = ({ item }) => {
    const partnerPhone = item.participants.find(p => p !== currentUser?.phone);
    const storedPartner = item.participantDetails?.[partnerPhone] || { agencyName: 'Travel Agency', agencyLogo: '💼', city: '', handlingPerson: '' };
    const partner = {
      ...storedPartner,
      ...(partnerProfiles[partnerPhone] || {})
    };
    
    // Highlight if last message is from partner and unread
    const isUnread = item.unread && item.lastSender !== currentUser?.phone;
    const unreadCount = isUnread ? (item.unreadCount || 1) : 0;

    return (
      <TouchableOpacity 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
          backgroundColor: isUnread ? 'rgba(14, 165, 233, 0.03)' : 'transparent',
        }}
        onPress={() => setActiveChat(item)}
      >
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
          borderWidth: 1.5,
          borderColor: isUnread ? '#0ea5e9' : 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}>
          {partner.agencyLogo && isImageUri(partner.agencyLogo) ? (
            <Image 
              source={getAvatarSource(partner.agencyLogo)} 
              style={{ width: '100%', height: '100%' }} 
              contentFit="cover" 
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={partner.agencyLogo}
            />
          ) : (
            <Text style={{ fontSize: 20 }}>{partner.agencyLogo || '💼'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>
                {partner.agencyName}
              </Text>
              {partner.handlingPerson ? (
                <Text style={{ color: '#9ca3af', fontSize: 13, fontWeight: '400' }}>
                  {'  '}•{'  '}{partner.handlingPerson}
                </Text>
              ) : null}
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 11 }}>{item.lastMessageTime}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text numberOfLines={1} style={{ color: isUnread ? '#e2e8f0' : '#9ca3af', fontSize: 13, fontWeight: isUnread ? '600' : '400', flex: 1, marginRight: 8 }}>
              {item.lastMessage}
            </Text>
            {unreadCount > 0 && (
              <View style={{
                backgroundColor: '#ef4444',
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                paddingHorizontal: 5,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', lineHeight: 13 }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render individual messages inside an active chat room
  const renderMessageItem = ({ item }) => {
    const isMe = (item.sender === currentUser?.phone) || (item.senderPhone === currentUser?.phone);
    const hasAttachment = !!item.fileUrl;

    return (
      <TouchableHighlight underlayColor="#0f172a" activeOpacity={1} onPress={() => {}}>
        <View style={{ width: '100%', paddingVertical: 2, backgroundColor: '#050b14' }}>
          <View style={{
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          backgroundColor: isMe ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: hasAttachment ? 6 : 10,
          paddingHorizontal: hasAttachment ? 6 : 14,
          marginHorizontal: 12,
          maxWidth: '75%',
          borderBottomRightRadius: isMe ? 2 : 16,
          borderBottomLeftRadius: isMe ? 16 : 2,
        }}>
        {item.fileType === 'image' ? (
          <TouchableOpacity onPress={() => setSelectedImageUri(item.fileUrl)}>
            <Image 
              source={{ uri: item.fileUrl }} 
              style={{
                width: 200,
                height: 200,
                borderRadius: 12,
                backgroundColor: 'rgba(0,0,0,0.1)'
              }} 
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        ) : item.fileType === 'pdf' ? (
          <TouchableOpacity 
            onPress={() => {
              if (item.fileUrl) {
                Linking.openURL(item.fileUrl).catch(err => {
                  console.error("Failed to open PDF link:", err);
                  Alert.alert("Error", "Could not open PDF link.");
                });
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.15)',
              padding: 10,
              borderRadius: 10,
              width: 200,
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 10 }}>📄</Text>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={2} style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
                {item.fileName || 'Document.pdf'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>
                {item.fileSize ? `${(item.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'PDF'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {item.text ? (
          <Text style={{ color: '#ffffff', fontSize: 14, marginTop: hasAttachment ? 6 : 0, paddingHorizontal: hasAttachment ? 8 : 0 }}>
            {item.text}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 }}>
          {item.isEdited ? (
            <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 9, marginRight: 4, paddingRight: hasAttachment && !isMe ? 8 : 0 }}>
              (edited)
            </Text>
          ) : null}
          <Text style={{ 
            color: isMe ? 'rgba(255, 255, 255, 0.6)' : '#6b7280', 
            fontSize: 9, 
            marginRight: isMe ? 4 : 0,
            paddingRight: hasAttachment && !isMe ? 8 : 0
          }}>
            {item.time}
          </Text>
          {isMe && (
            <Text style={{ 
              color: item.read ? '#00ffff' : 'rgba(255, 255, 255, 0.5)', 
              fontSize: 10,
              fontWeight: '700',
              paddingRight: hasAttachment ? 6 : 0
            }}>
              {item.read ? '✓✓' : item.received ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
        </View>
      </View>
      </TouchableHighlight>
    );
  };

  const renderHiddenItem = (data, rowMap) => {
    const item = data.item;
    const isMe = (item.sender === currentUser?.phone) || (item.senderPhone === currentUser?.phone);

    if (!isMe) {
      return (
        <View style={{ flex: 1 }} />
      );
    }

    return (
      <View style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
      }}>
        {!item.fileUrl && (
          <TouchableOpacity
            style={{
              backgroundColor: '#f59e0b',
              width: 55,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              rowMap[item.id]?.closeRow();
              setEditingMessageId(item.id);
              setMessageText(item.text || '');
            }}
          >
            <EditIcon size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{
            backgroundColor: '#ef4444',
            width: item.fileUrl ? 110 : 55,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            rowMap[item.id]?.closeRow();
            Alert.alert(
              "Delete Message",
              "Are you sure you want to delete this message?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Delete", 
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await apiService.deleteMessage(activeChat.id, item.id);
                    } catch (e) {
                      console.error("Error deleting message", e);
                    }
                  }
                }
              ]
            );
          }}
        >
          <DeleteIcon size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    );
  };

  if (activeChat) {
    const partnerPhone = activeChat.participants.find(p => p !== currentUser?.phone);
    const storedPartner = activeChat.participantDetails?.[partnerPhone] || { agencyName: 'Travel Agency', agencyLogo: '💼', city: '' };
    const partner = {
      ...storedPartner,
      ...(partnerProfiles[partnerPhone] || {})
    };

    return (
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#050b14' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Chat Header — safe area top only */}
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#050b14' }}>
          <View style={styles.appHeader}>
            <TouchableOpacity 
              style={styles.headerIconLeft}
              onPress={() => setActiveChat(null)}
            >
              <Text style={styles.headerIconText}>←</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}>
                {partner.agencyLogo && isImageUri(partner.agencyLogo) ? (
                  <Image 
                    source={getAvatarSource(partner.agencyLogo)} 
                    style={{ width: '100%', height: '100%' }} 
                    contentFit="cover" 
                    transition={200}
                    cachePolicy="memory-disk"
                    recyclingKey={partner.agencyLogo}
                  />
                ) : (
                  <Text style={{ fontSize: 14 }}>{partner.agencyLogo || '💼'}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>
                  {partner.agencyName}
                </Text>
                {partner.city ? (
                  <Text style={{ color: '#9ca3af', fontSize: 11 }}>{partner.city}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.headerRightSpacer} />
          </View>
        </SafeAreaView>

        {/* Messages List */}
        {loadingMessages ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0ea5e9" />
          </View>
        ) : (
          <SwipeListView
            listViewRef={flatListRef}
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 12 }}
            renderItem={renderMessageItem}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-110}
            disableRightSwipe={true}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={{ flex: 1, padding: 40, alignItems: 'center' }}>
                <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
                  No messages yet. Send a message to start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Editing Banner */}
        {editingMessageId && (
          <View style={{
            padding: 8,
            paddingHorizontal: 16,
            backgroundColor: 'rgba(245, 158, 11, 0.9)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Editing message...</Text>
            <TouchableOpacity onPress={() => { setEditingMessageId(null); setMessageText(''); }}>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload Status Overlay */}
        {sendingAttachment && (
          <View style={{
            padding: 8,
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopWidth: 1,
            borderTopColor: 'rgba(14, 165, 233, 0.3)'
          }}>
            <ActivityIndicator size="small" color="#0ea5e9" style={{ marginRight: 8 }} />
            <Text style={{ color: '#0ea5e9', fontSize: 12, fontWeight: '600' }}>Uploading attachment...</Text>
          </View>
        )}

        {/* Input Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.06)',
          backgroundColor: '#050b14',
          paddingBottom: Math.max(insets.bottom, 12)
        }}>
          {/* Attachment Selector Button */}
          <TouchableOpacity 
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 10,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
            onPress={() => setAttachmentMenuVisible(true)}
            disabled={sendingAttachment}
          >
            <Text style={{ color: '#ffffff', fontSize: 20 }}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
              height: 40,
              paddingHorizontal: 16,
              color: '#ffffff',
              fontSize: 16,
              marginRight: 10,
            }}
            placeholder="Type your message..."
            placeholderTextColor="#6b7280"
            value={messageText}
            onChangeText={setMessageText}
            onSubmitEditing={handleSend}
            disabled={sendingAttachment}
          />
          <TouchableOpacity 
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#0ea5e9',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={handleSend}
            disabled={sendingAttachment}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* Attachment Selection Drawer Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={attachmentMenuVisible}
          onRequestClose={() => setAttachmentMenuVisible(false)}
        >
          <TouchableOpacity 
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              justifyContent: 'flex-end',
            }}
            activeOpacity={1}
            onPress={() => setAttachmentMenuVisible(false)}
          >
            <View style={{
              backgroundColor: '#0f172a',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: Math.max(insets.bottom, 24)
            }}>
              <View style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
              
              <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 20, textAlign: 'center' }}>
                Share Document or Media
              </Text>



              {/* Option: Send Image */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  marginBottom: 12,
                  opacity: isPicking ? 0.5 : 1
                }}
                onPress={handlePickImage}
                disabled={isPicking}
              >
                <Text style={{ fontSize: 24, marginRight: 16 }}>📷</Text>
                <View>
                  <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>Send Image</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Choose from photo gallery</Text>
                </View>
              </TouchableOpacity>

              {/* Option: Send PDF */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  marginBottom: 20,
                  opacity: isPicking ? 0.5 : 1
                }}
                onPress={handlePickPDF}
                disabled={isPicking}
              >
                <Text style={{ fontSize: 24, marginRight: 16 }}>📄</Text>
                <View>
                  <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>Send PDF Document</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>Maximum file size: 10MB</Text>
                </View>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={{
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 12,
                }}
                onPress={() => setAttachmentMenuVisible(false)}
              >
                <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Full Screen Image Viewer Modal */}
        <Modal
          visible={!!selectedImageUri}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImageUri(null)}
        >
          <TouchableOpacity 
            style={{
              flex: 1,
              backgroundColor: '#000000',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={1}
            onPress={() => setSelectedImageUri(null)}
          >
            {selectedImageUri && (
              <Image 
                source={{ uri: selectedImageUri }}
                style={{
                  width: '95%',
                  height: '80%',
                }}
                contentFit="contain"
              />
            )}
            <TouchableOpacity 
              style={{
                position: 'absolute',
                top: Math.max(insets.top, 20),
                right: 20,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={() => setSelectedImageUri(null)}
            >
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#050b14' }}>
      {/* App Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity 
          style={styles.headerIconLeft}
          onPress={onGoBack}
        >
          <Text style={styles.headerIconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerLogoText}>
          <Text style={{ fontWeight: '300', color: '#ffffff' }}>trav</Text>
          <Text style={{ fontWeight: '900', color: '#0ea5e9' }}>hub</Text>
          <Text style={{ fontWeight: '300', color: '#9ca3af', fontSize: 16 }}> chats</Text>
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={renderChatItem}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={styles.emptyText}>No active conversations yet.</Text>
              <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                Browse the feed and click Chat on any listing to start messaging.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;
