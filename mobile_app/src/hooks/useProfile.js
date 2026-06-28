import { useState, useRef, useEffect } from 'react';
import { Alert, PanResponder, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/apiService';
import { compressImageNative } from '../utils/helpers';

export const useProfile = (currentUserInfo, onProfileUpdate) => {
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  
  // Profile Editor Form states
  const [editAgencyName, setEditAgencyName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [tempLogo, setTempLogo] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  const [editStreetAddress, setEditStreetAddress] = useState('');
  const [editCountry, setEditCountry] = useState('India');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editHandlingPerson, setEditHandlingPerson] = useState('');
  const [editHandlingPosition, setEditHandlingPosition] = useState('');
  
  const [editUserType, setEditUserType] = useState('agency');
  const [editAgencyType, setEditAgencyType] = useState('b2c');
  const [editHotelCategory, setEditHotelCategory] = useState('resort');
  const [editSpecializations, setEditSpecializations] = useState([]);
  const [editGstin, setEditGstin] = useState('');

  // Image Cropping logic moved to Native OS (allowsEditing: true)
  const [logoMode, setLogoMode] = useState('preset'); // preset | custom
  const [selectedPreset, setSelectedPreset] = useState('💼');

  const isImageUri = (str) => {
    if (!str) return false;
    return str.length > 6 || str.startsWith('http') || str.startsWith('data:') || str.startsWith('file:') || str.startsWith('content:');
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to access your gallery to pick a logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true, // Native OS cropping
        aspect: [1, 1],      // Square crop
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const compressedUri = await compressImageNative(result.assets[0].uri);
        setTempLogo(compressedUri);
        setLogoMode('custom');
      }
    } catch (err) {
      console.error("Error picking image: ", err);
      Alert.alert("Picker Error", "Could not open device gallery.");
    }
  };

  const changeAvatarDirectly = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to access your gallery.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true, // Native OS cropping
        aspect: [1, 1],      // Square crop
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        const compressedUri = await compressImageNative(pickedUri);
        let finalLogo = compressedUri;
        
        if (compressedUri.startsWith('file://') || compressedUri.startsWith('data:image') || compressedUri.startsWith('blob:')) {
          finalLogo = await apiService.uploadImage(compressedUri, 'profiles');
        }
        
        const oldFeedName = currentUserInfo.agencyName ? `${currentUserInfo.agencyName} (${currentUserInfo.city || 'India'})` : '';
        
        await apiService.updateUserProfile(currentUserInfo.phone, { agencyLogo: finalLogo });

        if (onProfileUpdate) {
          onProfileUpdate({ agencyLogo: finalLogo });
        }
        
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (err) {
      console.error("Error updating avatar directly: ", err);
      Alert.alert("Error", "Could not update profile photo.");
    }
  };

  const toggleSpecialization = (spec) => {
    if (editSpecializations.includes(spec)) {
      setEditSpecializations(editSpecializations.filter(s => s !== spec));
    } else {
      setEditSpecializations([...editSpecializations, spec]);
    }
  };

  const openProfileEditor = () => {
    setEditAgencyName(currentUserInfo.agencyName || '');
    setEditCity(currentUserInfo.city || '');
    setEditUserType(currentUserInfo.currentUserType || 'agency');
    setEditAgencyType(currentUserInfo.currentAgencyType || 'b2c');
    setEditHotelCategory(currentUserInfo.currentHotelCategory || 'resort');
    setEditSpecializations(currentUserInfo.currentSpecializations || []);
    setEditGstin(currentUserInfo.currentGstin || '');
    setEditBio(currentUserInfo.bio || '');
    setEditEmail(currentUserInfo.email || '');
    setEditStreetAddress(currentUserInfo.streetAddress || '');
    setEditCountry(currentUserInfo.country || 'India');
    setEditState(currentUserInfo.state || '');
    setEditPincode(currentUserInfo.pincode || '');
    setEditHandlingPerson(currentUserInfo.handlingPerson || '');
    setEditHandlingPosition(currentUserInfo.handlingPosition || '');
    setTempLogo(currentUserInfo.agencyLogo || '');
    
    if (currentUserInfo.agencyLogo && isImageUri(currentUserInfo.agencyLogo)) {
      setLogoMode('custom');
    } else {
      setLogoMode('preset');
      setSelectedPreset(currentUserInfo.agencyLogo || '💼');
    }
    setShowLogoEditor(false);
    setProfileModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!editAgencyName.trim() || !editCity.trim()) {
      Alert.alert('Required Fields', 'Please fill in both your business name and city.');
      return;
    }
    try {
      let finalLogo = logoMode === 'preset' ? selectedPreset : tempLogo;
      
      if (logoMode === 'custom' && isImageUri(tempLogo) && (tempLogo.startsWith('file://') || tempLogo.startsWith('data:image') || tempLogo.startsWith('blob:'))) {
        finalLogo = await apiService.uploadImage(tempLogo, 'profiles');
      }
      
      const oldFeedName = currentUserInfo.agencyName ? `${currentUserInfo.agencyName} (${currentUserInfo.city || 'India'})` : '';
      const updatedFields = {
        agencyName: editAgencyName,
        city: editCity,
        agencyLogo: finalLogo,
        userType: editUserType,
        agencyType: editUserType === 'agency' ? editAgencyType : null,
        hotelCategory: editUserType === 'hotel' ? editHotelCategory : null,
        specializations: editUserType === 'agency' ? editSpecializations : null,
        gstin: editGstin.trim() || null,
        bio: editBio.trim() || '',
        email: editEmail.trim() || '',
        streetAddress: editStreetAddress.trim() || '',
        country: editCountry.trim() || '',
        state: editState.trim() || '',
        pincode: editPincode.trim() || '',
        handlingPerson: editHandlingPerson.trim() || '',
        handlingPosition: editHandlingPosition.trim() || ''
      };

      await apiService.updateUserProfile(currentUserInfo.phone, updatedFields);

      setProfileModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
      if (onProfileUpdate) {
        onProfileUpdate(updatedFields);
      }
    } catch (error) {
      Alert.alert('Update Error', error.message);
    }
  };

  return {
    profileModalVisible,
    setProfileModalVisible,
    showLogoEditor,
    setShowLogoEditor,
    
    // Form States
    editAgencyName,
    setEditAgencyName,
    editCity,
    setEditCity,
    tempLogo,
    setTempLogo,
    editBio,
    setEditBio,
    editEmail,
    setEditEmail,
    editStreetAddress,
    setEditStreetAddress,
    editCountry,
    setEditCountry,
    editState,
    setEditState,
    editPincode,
    setEditPincode,
    editHandlingPerson,
    setEditHandlingPerson,
    editHandlingPosition,
    setEditHandlingPosition,
    editUserType,
    setEditUserType,
    editAgencyType,
    setEditAgencyType,
    editHotelCategory,
    setEditHotelCategory,
    editSpecializations,
    setEditSpecializations,
    editGstin,
    setEditGstin,

    logoMode,
    setLogoMode,
    selectedPreset,
    setSelectedPreset,
    
    // Actions
    pickImage,
    changeAvatarDirectly,
    openProfileEditor,
    handleUpdateProfile,
    toggleSpecialization
  };
};
