import React from 'react';
import { Modal, View, TouchableOpacity, Text, ScrollView, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/themeStyles';
import { getAvatarSource } from '../utils/helpers';

export const ProfileEditorModal = ({
  visible,
  onClose,
  profileHook,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#050b14' }}>
        {/* Instagram Edit Profile Header */}
        <View style={styles.editProfileHeader}>
          <TouchableOpacity onPress={onClose} style={styles.editHeaderBtn}>
            <Text style={styles.editHeaderBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={profileHook.handleUpdateProfile}
            style={styles.editHeaderBtn}
          >
            <Text style={[styles.editHeaderBtnText, { color: '#0ea5e9', fontWeight: '800' }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.editProfileScroll}>


          {/* Section: Basic Information */}
          <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '800', marginLeft: 20, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Basic Information</Text>
          <View style={styles.editFormCard}>
            {/* 1. Company Name */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Company Name</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="Enter business name"
                placeholderTextColor="#6b7280"
                value={profileHook.editAgencyName}
                onChangeText={profileHook.setEditAgencyName}
              />
            </View>

            {/* 2. Account Handler */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Account Handler</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="Person handling the account"
                placeholderTextColor="#6b7280"
                value={profileHook.editHandlingPerson}
                onChangeText={profileHook.setEditHandlingPerson}
              />
            </View>

            {/* 3. Handler Position */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Position in Company</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="e.g. Director, Operations Manager"
                placeholderTextColor="#6b7280"
                value={profileHook.editHandlingPosition}
                onChangeText={profileHook.setEditHandlingPosition}
              />
            </View>
          </View>

          {/* Section: Contact Information */}
          <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '800', marginLeft: 20, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Contact Information</Text>
          <View style={styles.editFormCard}>
            {/* Email Address */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Email Address</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="Enter email address"
                placeholderTextColor="#6b7280"
                keyboardType="email-address"
                autoCapitalize="none"
                value={profileHook.editEmail}
                onChangeText={profileHook.setEditEmail}
              />
            </View>

            {/* 4. Bio */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Company Bio</Text>
              <TextInput
                style={[styles.editFormInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Short description of your company..."
                placeholderTextColor="#6b7280"
                multiline={true}
                numberOfLines={3}
                value={profileHook.editBio}
                onChangeText={profileHook.setEditBio}
              />
            </View>

            {/* 4.5. Street Address */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Street Address</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="e.g. 1st Floor, Connaught Place"
                placeholderTextColor="#6b7280"
                value={profileHook.editStreetAddress}
                onChangeText={profileHook.setEditStreetAddress}
              />
            </View>

            {/* 5. Country */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Country</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="Country"
                placeholderTextColor="#6b7280"
                value={profileHook.editCountry}
                onChangeText={profileHook.setEditCountry}
              />
            </View>

            {/* 6. State */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>State</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="State"
                placeholderTextColor="#6b7280"
                value={profileHook.editState}
                onChangeText={profileHook.setEditState}
              />
            </View>

            {/* 7. City */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>City</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="City"
                placeholderTextColor="#6b7280"
                value={profileHook.editCity}
                onChangeText={profileHook.setEditCity}
              />
            </View>

            {/* 8. Pincode */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Pincode</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="6-digit pincode"
                placeholderTextColor="#6b7280"
                keyboardType="number-pad"
                maxLength={6}
                value={profileHook.editPincode}
                onChangeText={profileHook.setEditPincode}
              />
            </View>
          </View>

          {/* Section: Business Details */}
          <Text style={{ color: '#0ea5e9', fontSize: 13, fontWeight: '800', marginLeft: 20, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Business Details</Text>
          <View style={styles.editFormCard}>
            {/* 9. GSTIN */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>GSTIN ID</Text>
              <TextInput
                style={styles.editFormInput}
                placeholder="Optional GSTIN"
                placeholderTextColor="#6b7280"
                value={profileHook.editGstin}
                onChangeText={profileHook.setEditGstin}
                autoCapitalize="characters"
              />
            </View>

            {/* 10. Entity Type (Locked with Request Change) */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Entity Type</Text>
              <View style={styles.editFormLockedRow}>
                <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
                  {profileHook.editUserType === 'agency' ? '✈️ Travel Agency' : '🏨 Hotel / Stay'}
                </Text>
                <TouchableOpacity 
                  style={styles.requestChangeBtn}
                  onPress={() => Alert.alert('Change Request', 'Your request to change Entity Type has been logged.')}
                >
                  <Text style={styles.requestChangeBtnText}>Request Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 11. Business Focus (Locked with Request Change) */}
            <View style={styles.editFormInputGroup}>
              <Text style={styles.editFormLabel}>Business Focus</Text>
              <View style={styles.editFormLockedRow}>
                <Text style={{ color: '#9ca3af', fontSize: 14, fontWeight: '600' }}>
                  {profileHook.editUserType === 'agency' 
                    ? (profileHook.editAgencyType === 'b2c' ? 'B2C (Direct)' : profileHook.editAgencyType === 'b2b' ? 'B2B (Agents)' : 'Hybrid')
                    : `Hotel (${profileHook.editHotelCategory ? profileHook.editHotelCategory.toUpperCase() : 'Resort'})`
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.requestChangeBtn}
                  onPress={() => Alert.alert('Change Request', 'Your request to change Business Focus has been logged.')}
                >
                  <Text style={styles.requestChangeBtnText}>Request Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default ProfileEditorModal;
