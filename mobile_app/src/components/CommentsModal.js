import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { styles } from '../styles/themeStyles';
import { apiService } from '../services/apiService';
import { isImageUri, getAvatarSource } from '../utils/helpers';
import { CloseIcon, CheckCircleIcon, CommentOutlineIcon, SendIcon } from './SvgIcons';

export const CommentsModal = ({
  visible,
  post,
  onClose,
  currentUser,
  onCommentAdded
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!post || !visible) return;

    setLoading(true);
    const unsubscribe = apiService.subscribeToComments(
      post.id,
      (items) => {
        setComments(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to comments: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [post, visible]);

  const handleSendComment = async () => {
    if (!newCommentText.trim()) return;
    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to comment.");
      return;
    }

    setSubmitting(true);
    try {
      const commentData = {
        text: newCommentText.trim(),
        phone: currentUser.phone || '',
        agencyName: currentUser.agencyName || 'Unknown Agent',
        agencyLogo: currentUser.agencyLogo || '💼',
        isVerified: currentUser.currentUserVerified || false
      };

      await apiService.addComment(post.id, commentData);
      
      // Optimistic update
      const newComment = {
        id: Date.now().toString(),
        ...commentData,
        createdAt: new Date().toISOString()
      };
      setComments(prev => [...prev, newComment]);

      setNewCommentText('');
      if (onCommentAdded) onCommentAdded();
      
      // Notify the post author if it's not their own comment
      if (post.phone && post.phone !== currentUser.phone) {
        const notifMessage = `${currentUser.agencyName || 'Someone'} commented on your post.`;
        await apiService.createNotification(post.phone, notifMessage, 'comment', '💬', post.id);
        
        // Fetch post author profile to get expoPushToken
        try {
          const authorProfile = await apiService.fetchUserByPhone(post.phone);
          if (authorProfile && authorProfile.expoPushToken) {
            const { notificationService } = require('../services/notificationService');
            notificationService.sendPushNotification(
              authorProfile.expoPushToken, 
              'New Comment', 
              notifMessage, 
              { postId: post.id }
            );
          }
        } catch (err) {
          console.error("Failed to fetch author push token:", err);
        }
      }

    } catch (err) {
      console.error("Failed to add comment:", err);
      Alert.alert("Error", "Could not post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.commentsOverlay}>
          <View style={styles.commentsContainer}>
            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={onClose} style={styles.commentsCloseBtn}>
                <CloseIcon size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* List of comments */}
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0ea5e9" />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.commentsListContent}
                renderItem={({ item }) => {
                  const cleanName = item.agencyName ? item.agencyName.replace(/\s*\(.*?\)/g, '') : 'Agent';
                  return (
                    <View style={styles.commentItem}>
                      <View style={[styles.avatarCircle, { width: 30, height: 30, borderRadius: 15, marginRight: 8, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 }]}>
                        {item.agencyLogo && isImageUri(item.agencyLogo) ? (
                          <Image source={getAvatarSource(item.agencyLogo)} style={{ width: 26, height: 26, borderRadius: 13 }} />
                        ) : (
                          <Text style={{ fontSize: 13 }}>{item.agencyLogo || '💼'}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={styles.commentAuthorName}>{cleanName}</Text>
                          {item.isVerified && (
                            <CheckCircleIcon size={12} color="#0ea5e9" style={{ marginLeft: 3 }} />
                          )}
                        </View>
                        <Text style={styles.commentText}>{item.text}</Text>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.commentsEmpty}>
                    <CommentOutlineIcon size={36} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.commentsEmptyText}>No comments yet. Be the first to comment!</Text>
                  </View>
                }
              />
            )}

            {/* Input bar */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={newCommentText}
                onChangeText={setNewCommentText}
                maxLength={300}
                multiline
              />
              <TouchableOpacity 
                style={[styles.commentSendBtn, !newCommentText.trim() && { opacity: 0.5 }]} 
                onPress={handleSendComment}
                disabled={submitting || !newCommentText.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#0ea5e9" />
                ) : (
                  <SendIcon size={20} color="#0ea5e9" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CommentsModal;
