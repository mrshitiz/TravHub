import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiService, socket } from '../services/apiService';
import { databaseService } from '../services/databaseService';
import { compressImageNative } from '../utils/helpers';

export const useFeed = (currentUser) => {
  const [feedType, setFeedType] = useState('all'); // all | b2b | b2c
  const [feedData, setFeedData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPostsAvailable, setNewPostsAvailable] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  // States for creating a post
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [newDestination, setNewDestination] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('inquiry'); // inquiry | guidance | showcase
  const [newPostImages, setNewPostImages] = useState([]);

  // Action Menu states
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedActionPost, setSelectedActionPost] = useState(null);

  // 1. Initial Load: Try Cache first, then check for new posts
  useEffect(() => {
    const initFeed = async () => {
      try {
        const CACHE_VERSION = '1.0.2'; // Bump this to force clear user caches
        const currentVersion = databaseService.getItem('feed_cache_version');
        
        if (currentVersion !== CACHE_VERSION) {
          databaseService.removeItem('feed_cache');
          databaseService.setItem('feed_cache_version', CACHE_VERSION);
        }

        const cachedStr = databaseService.getItem('feed_cache');
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          setFeedData(cachedData);
          if (cachedData.length > 0) {
            const latestTimestamp = cachedData[0].createdAt || cachedData[0].timestamp;
            const newItems = await apiService.checkNewFeeds(latestTimestamp);
            const uniqueNewItems = newItems.filter(
              newItem => !cachedData.some(existing => existing.id === newItem.id)
            );
            if (uniqueNewItems.length > 0) {
              setNewPostsAvailable(uniqueNewItems);
            }
            return;
          }
        }
        await fetchInitialFeed();
      } catch (e) {
        console.error('Failed to load feed cache', e);
        await fetchInitialFeed();
      }
    };
    initFeed();
  }, []);

  // Listen for real-time post deletions
  useEffect(() => {
    const handlePostDeleted = (deletedPostId) => {
      setFeedData(prev => {
        if (!prev.some(p => p.id === deletedPostId)) return prev;
        const newData = prev.filter(p => p.id !== deletedPostId);
        setTimeout(() => saveToCache(newData), 0);
        return newData;
      });
    };

    socket.on('post_deleted', handlePostDeleted);
    return () => socket.off('post_deleted', handlePostDeleted);
  }, []);

  // 2. Listen for real-time new posts
  useEffect(() => {
    const handleNewPost = (rawPost) => {
      // Normalize _id → id to match the format used by apiService.fetchFeedPage
      const newPost = rawPost.id ? rawPost : { id: rawPost._id, ...rawPost };
      
      setFeedData(prev => {
        // Ignore if we already have it
        if (prev.some(p => p.id === newPost.id)) return prev;
        
        setNewPostsAvailable(prevNew => {
          if (prevNew.some(p => p.id === newPost.id)) return prevNew;
          return [newPost, ...prevNew];
        });
        
        return prev;
      });
    };

    socket.on('new_post', handleNewPost);
    return () => socket.off('new_post', handleNewPost);
  }, []);

  // 3. Listen for real-time comment updates
  useEffect(() => {
    const handleNewComment = ({ postId, commentsCount }) => {
      setFeedData(prev => {
        const newData = prev.map(p => 
          p.id === postId 
            ? { ...p, comments: commentsCount !== undefined ? commentsCount : (p.comments || 0) + 1 } 
            : p
        );
        saveToCache(newData);
        return newData;
      });
    };
    socket.on('new_comment', handleNewComment);
    return () => socket.off('new_comment', handleNewComment);
  }, []);

  // 4. Listen for real-time profile updates (like logo changes)
  useEffect(() => {
    const handleProfileUpdated = ({ phone, updates }) => {
      setFeedData(prev => {
        let changed = false;
        const newData = prev.map(p => {
          if (p.phone === phone) {
            changed = true;
            return { ...p, ...updates };
          }
          return p;
        });
        if (changed) saveToCache(newData);
        return newData;
      });
    };
    socket.on('profile_updated', handleProfileUpdated);
    return () => socket.off('profile_updated', handleProfileUpdated);
  }, []);

  const saveToCache = (data) => {
    try {
      databaseService.setItem('feed_cache', JSON.stringify(data.slice(0, 20))); // cache top 20
    } catch (e) {}
  };

  const fetchInitialFeed = async () => {
    setRefreshing(true);
    try {
      const items = await apiService.fetchFeedPage(20, null);
      setFeedData(items);
      setHasMore(items.length === 20);
      saveToCache(items);
      setNewPostsAvailable([]);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadNewPosts = () => {
    if (newPostsAvailable.length > 0) {
      const uniqueNewPosts = newPostsAvailable.filter(
        newPost => !feedData.some(existingPost => existingPost.id === newPost.id)
      );
      const merged = [...uniqueNewPosts, ...feedData];
      setFeedData(merged);
      saveToCache(merged);
      setNewPostsAvailable([]);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore || feedData.length === 0) return;
    setLoadingMore(true);
    try {
      const lastTimestamp = feedData[feedData.length - 1].timestamp;
      const olderItems = await apiService.fetchFeedPage(20, lastTimestamp);
      if (olderItems.length > 0) {
        const newItems = olderItems.filter(item => !feedData.some(f => f.id === item.id));
        const merged = [...feedData, ...newItems];
        setFeedData(merged);
        saveToCache(merged);
      }
      if (olderItems.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading older feed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    await fetchInitialFeed();
  };

  const compressImageWeb = (rawUri) => {
    return new Promise((resolve) => {
      if (!rawUri.startsWith('data:image') && !rawUri.startsWith('blob:')) {
        resolve(rawUri);
        return;
      }
      const img = new window.Image();
      img.src = rawUri;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 600; 
        canvas.width = size;
        canvas.height = size;
        
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
      img.onerror = () => {
        resolve(rawUri);
      };
    });
  };

  const pickPostImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need gallery permission to choose post images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.4,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const compressedUris = await Promise.all(
          result.assets.map(async (asset) => {
            if (Platform.OS === 'web') {
              return await compressImageWeb(asset.uri);
            }
            return await compressImageNative(asset.uri);
          })
        );
        setNewPostImages(prev => [...prev, ...compressedUris]);
      }
    } catch (err) {
      console.error("Error picking post images:", err);
      Alert.alert("Picker Error", "Could not choose gallery images.");
    }
  };

  const handleAddPost = async () => {
    if (!currentUser) return;
    const isB2B = currentUser.userType === 'hotel' || currentUser.agencyType === 'b2b';

    if (currentUser.status === 'pending') {
      Alert.alert('Pending Verification', 'Your profile is currently undergoing verification. You will be able to post once approved.');
      return;
    }

    if (isB2B) {
      if (!newDestination || !newDetails || !newBudget) {
        Alert.alert('Required Fields', 'Please fill in all post details.');
        return;
      }
    } else {
      if (!newDetails) {
        Alert.alert('Required Fields', 'Please enter your post details.');
        return;
      }
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    try {
      const postType = isB2B ? 'b2b_ad' : 'b2c_inquiry';
      const cleanDetails = newDetails.trim().replace(/\n/g, ' ');
      const fallbackDest = cleanDetails.substring(0, 30) + (cleanDetails.length > 30 ? '...' : '');
      const fallbackDestTag = cleanDetails.replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) || 'Post';
      
      let titleStr = '';
      let tagLabel = 'Inquiry';
      if (isB2B) {
        titleStr = `✈️ B2B Offer: ${newDestination}`;
        tagLabel = 'B2BOffer';
      } else {
        if (newPostCategory === 'guidance') {
          titleStr = `💡 Guidance: ${fallbackDest}`;
          tagLabel = 'Guidance';
        } else if (newPostCategory === 'showcase') {
          titleStr = `✨ Showcase: ${fallbackDest}`;
          tagLabel = 'Showcase';
        } else {
          titleStr = `🔍 Inquiry: ${fallbackDest}`;
          tagLabel = 'Inquiry';
        }
      }

      const postData = {
        type: postType,
        agencyName: currentUser.agencyName ? `${currentUser.agencyName} (${currentUser.city || 'India'})` : 'Pioneer Travels',
        agencyLogo: currentUser.agencyLogo || '💼',
        isVerified: currentUser.isVerified || false,
        verificationStatus: currentUser.verificationStatus || 'none',
        status: 'active',
        title: titleStr,
        description: newDetails,
        price: isB2B ? `Deal Price: ₹${newBudget}` : '',
        category: isB2B ? 'b2b' : newPostCategory,
        tags: [isB2B ? newDestination.replace(/\s+/g, '') : fallbackDestTag, tagLabel],
        likes: 0,
        comments: 0,
        time: `Today, ${timeString}`,
        timestamp: now.toISOString(),
        userType: currentUser.userType,
        agencyType: currentUser.userType === 'agency' ? currentUser.agencyType : null,
        hotelCategory: currentUser.userType === 'hotel' ? currentUser.hotelCategory : null,
        specializations: currentUser.userType === 'agency' ? currentUser.specializations : null,
        gstin: currentUser.gstin || null,
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        streetAddress: currentUser.streetAddress || '',
        country: currentUser.country || '',
        state: currentUser.state || '',
        pincode: currentUser.pincode || '',
        handlingPerson: currentUser.handlingPerson || '',
        handlingPosition: currentUser.handlingPosition || ''
      };

      let uploadedImages = [];
      if (newPostImages.length > 0) {
        uploadedImages = await Promise.all(
          newPostImages.map(async (imgUri) => await apiService.uploadImage(imgUri))
        );
      }
      if (uploadedImages.length > 0) {
        postData.images = uploadedImages;
        postData.image = uploadedImages[0];
      }

      await apiService.createPost(postData);

      setNewDestination('');
      setNewDetails('');
      setNewBudget('');
      setNewPostCategory('inquiry');
      setNewPostImages([]);
      setInquiryModalVisible(false);
      Alert.alert('Success', 'Post published successfully!');
      handleRefresh(); // refresh manually since subscription is off
    } catch (error) {
      Alert.alert('Error Posting', error.message);
    }
  };
  const updatePostCommentCount = (postId) => {
    setFeedData(prev => prev.map(p => p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p));
  };


  const handleDeletePost = (postId) => {
    const processDelete = async () => {
      try {
        await apiService.deletePost(postId);
        if (Platform.OS === 'web') {
          window.alert("Post deleted successfully!");
        } else {
          Alert.alert("Success", "Post deleted successfully!");
        }
        setFeedData(prev => {
          const newData = prev.filter(p => p.id !== postId);
          setTimeout(() => saveToCache(newData), 0);
          return newData;
        });
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert(error.message);
        } else {
          Alert.alert("Error Deleting", error.message);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm("Are you sure you want to delete this post?");
      if (confirmDelete) {
        processDelete();
      }
      return;
    }

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: processDelete 
        }
      ]
    );
  };

  const filteredFeed = feedData.filter(item => {
    if (item.status === 'blocked') return false;
    if (feedType === 'all') return true;
    if (feedType === 'b2b') return item.type === 'b2b_ad';
    if (feedType === 'b2c') return item.type === 'b2c_inquiry';
    return true;
  });

  return {
    feedType,
    setFeedType,
    feedData,
    filteredFeed,
    refreshing,
    handleRefresh,
    
    // Pagination & New Posts
    loadMorePosts,
    loadingMore,
    newPostsAvailable,
    loadNewPosts,

    // Post creation states & actions
    inquiryModalVisible,
    setInquiryModalVisible,
    newDestination,
    setNewDestination,
    newDetails,
    setNewDetails,
    newBudget,
    setNewBudget,
    newPostCategory,
    setNewPostCategory,
    newPostImages,
    setNewPostImages,
    pickPostImages,
    handleAddPost,
    
    // Action menu / delete
    actionMenuVisible,
    setActionMenuVisible,
    selectedActionPost,
    setSelectedActionPost,
    handleDeletePost,
    updatePostCommentCount
  };
};
