import { databaseService } from './databaseService';
import io from 'socket.io-client';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
let BASE_URL = 'http://192.168.1.X:3000';
if (isWeb) {
  if (window.location.port === '8081' || window.location.port === '8082') {
    BASE_URL = window.location.protocol + '//' + window.location.hostname + ':3000';
  } else {
    BASE_URL = window.location.origin;
  }
}
const API_URL = `${BASE_URL}/api`;
export const socket = io(BASE_URL);

export const apiService = {
  async uploadImage(base64OrUri, folder = 'posts') {
    let blob;
    if (Platform.OS === 'web') {
      const res = await fetch(base64OrUri);
      blob = await res.blob();
    } else {
      blob = {
        uri: base64OrUri,
        type: 'image/webp',
        name: 'upload.webp'
      };
    }

    const formData = new FormData();
    // On web, we must append a File or provide a filename as the 3rd arg.
    formData.append('file', blob, 'image.webp');

    const res = await fetch(`${API_URL}/upload?folder=${folder}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${errText.substring(0, 50)}`);
    }
    const data = await res.json();
    let fileUrl = data.fileUrl;
    if (fileUrl && fileUrl.startsWith('/')) {
      fileUrl = BASE_URL + fileUrl;
    }
    return fileUrl;
  },

  async loginUser(phone, pin) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { throw new Error('Server returned invalid data (Backend might need a restart)'); }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return { id: data._id, ...data };
  },

  async checkUserExists(phone) {
    const res = await fetch(`${API_URL}/users/exists/${phone}`);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { throw new Error('Server returned invalid data (Backend might need a restart)'); }
    return data.exists;
  },

  async registerUser(userData) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { throw new Error('Server returned invalid data (Backend might need a restart)'); }
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data.id;
  },

  async updateUserProfile(phone, editData) {
    const res = await fetch(`${API_URL}/users/${phone}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    return data._id;
  },

  async fetchFeedPage(limitCount = 20, lastTimestamp = null) {
    const query = new URLSearchParams({ limit: limitCount });
    if (lastTimestamp) query.append('lastTimestamp', lastTimestamp);
    
    const res = await fetch(`${API_URL}/feed?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to fetch feed');
    return data.map(doc => ({ id: doc._id, ...doc }));
  },

  async checkNewFeeds(latestTimestamp) {
    const query = new URLSearchParams({ latestTimestamp });
    const res = await fetch(`${API_URL}/feed/new?${query.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(doc => ({ id: doc._id, ...doc }));
  },

  async fetchPostById(postId) {
    const res = await fetch(`${API_URL}/feed/${postId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { id: data._id, ...data };
  },

  async createPost(postData) {
    const res = await fetch(`${API_URL}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create post: ${res.status} - ${errText.substring(0, 50)}`);
    }
    const data = await res.json();
    return data.id;
  },

  async deletePost(postId) {
    const res = await fetch(`${API_URL}/feed/${postId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete post');
  },

  async fetchUserByPhone(phone) {
    const res = await fetch(`${API_URL}/users/${phone}`);
    if (res.status === 404) return null;
    const data = await res.json();
    return { id: data._id, ...data };
  },
  
  async toggleSavePost(phone, postId, isSaved) {
    await fetch(`${API_URL}/users/${phone}/save/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSaved })
    });
  },

  // Socket based real-time listeners
  subscribeToFeed(onUpdate, onError) {
    this.fetchFeedPage(50).then(onUpdate).catch(onError);
    
    const refetch = async () => {
      try {
        const posts = await this.fetchFeedPage(50);
        onUpdate(posts);
      } catch (err) { onError(err); }
    };

    socket.on('new_post', refetch);
    socket.on('post_deleted', refetch);

    return () => {
      socket.off('new_post', refetch);
      socket.off('post_deleted', refetch);
    };
  },
  
  subscribeToChats(myPhone, onUpdate, onError) {
    const fetchChats = () => {
      fetch(`${API_URL}/chats/user/${myPhone}`)
        .then(res => res.json())
        .then(chats => onUpdate(chats.map(c => ({ id: c._id, ...c }))))
        .catch(onError);
    };

    fetchChats();
    socket.on('chat_update', fetchChats);
    return () => { socket.off('chat_update', fetchChats); };
  },

  async fetchUserByNameAndCity(agencyName, city) {
    const query = new URLSearchParams({ agencyName, city });
    const res = await fetch(`${API_URL}/users/find/query?${query.toString()}`);
    if (res.status === 404) return null;
    const data = await res.json();
    return { id: data._id, ...data };
  },

  async startOrCreateChat(currentUser, targetUser) {
    const res = await fetch(`${API_URL}/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myUser: currentUser, targetUser })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to start chat');
    return { id: data._id, ...data };
  },

  async markNotificationsAsRead(ids) {
    if (!ids || ids.length === 0) return;
    try {
      await fetch(`${API_URL}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  },

  subscribeToNotifications(myPhone, onUpdate) {
    let currentNotifications = [];

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications/user/${myPhone}`);
        if (res.ok) {
          const data = await res.json();
          currentNotifications = data.map(n => ({ id: n._id, ...n }));
          onUpdate(currentNotifications);
        }
      } catch (err) { console.error('Error fetching notifications:', err); }
    };
    fetchInitial();

    const handleNewNotification = (notification) => {
      if (notification.userId === myPhone) {
        const formatted = { id: notification._id, ...notification };
        currentNotifications = [formatted, ...currentNotifications];
        onUpdate(currentNotifications);
      }
    };

    socket.on('new_notification', handleNewNotification);
    return () => { socket.off('new_notification', handleNewNotification); };
  },

  // --- COMMENTS ---
  async fetchComments(postId) {
    const res = await fetch(`${API_URL}/feed/${postId}/comments`);
    const data = await res.json();
    return data.map(c => ({ id: c._id, ...c }));
  },
  
  subscribeToComments(postId, onUpdate, onError) {
    this.fetchComments(postId).then(onUpdate).catch(onError);
    // Stub socket
    return () => {};
  },

  async addComment(postId, commentData) {
    const res = await fetch(`${API_URL}/feed/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to add comment: ${errText.substring(0, 50)}`);
    }
  },

  // --- MESSAGES / CHAT ---
  async fetchMessages(chatId) {
    const res = await fetch(`${API_URL}/chats/${chatId}/messages`);
    const data = await res.json();
    return data.map(m => ({ id: m._id, ...m }));
  },

  subscribeToMessages(chatId, onUpdate, onError) {
    const fetchMsgs = () => {
      this.fetchMessages(chatId).then(onUpdate).catch(onError);
    };
    fetchMsgs();

    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        fetchMsgs();
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => { socket.off('new_message', handleNewMessage); };
  },

  async sendMessage(chatId, senderPhone, text, fileData = null) {
    const payload = { senderPhone, text, timestamp: new Date().toISOString() };
    if (fileData) {
      Object.assign(payload, fileData);
    }
    await fetch(`${API_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async editMessage(chatId, messageId, newText) {
    // Stub for edit
  },

  async deleteMessage(chatId, messageId) {
    // Stub for delete
  },

  markMessagesAsReceived(chatId, partnerPhone) {},
  markMessagesAsRead(chatId, partnerPhone) {},
  async markChatAsRead(chatId, phone) {
    try {
      await fetch(`${API_URL}/chats/${chatId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
    } catch (err) {
      console.error('Failed to mark chat as read', err);
    }
  },

  subscribeToUserProfiles(phones, onUpdate) {
    onUpdate([]);
    return () => {};
  },

  // --- PROFILE FOLLOW/UNFOLLOW ---
  async followUser(myPhone, targetPhone) {},
  async unfollowUser(myPhone, targetPhone) {}
};
