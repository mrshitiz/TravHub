import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/themeStyles';
import { specializationOptions, hotelCategories } from '../constants/constants';

export const WelcomeScreen = ({
  authHook,
}) => {
  return (
    <SafeAreaView style={styles.welcomeContainer}>
      <ScrollView contentContainerStyle={styles.welcomeScroll}>
        <View style={styles.headerSpacer} />
        <Text style={styles.welcomeLogoText}>
          <Text style={{ fontWeight: '300', color: '#ffffff' }}>trav</Text>
          <Text style={{ fontWeight: '900', color: '#0ea5e9' }}>hub</Text>
        </Text>
        <Text style={styles.welcomeSubtitle}>
          India's Interactive Exchange for Verified B2B & B2C Travel Agents.
        </Text>
        
        <View style={styles.loginCard}>
          {authHook.authMode === 'signup' && (
            <>
              <Text style={styles.inputLabel}>Entity Type</Text>
              <View style={styles.segmentedContainer}>
                <TouchableOpacity 
                  style={[styles.segmentBtn, authHook.userType === 'agency' && styles.segmentBtnActive]}
                  onPress={() => {
                    authHook.setUserType('agency');
                    if (authHook.agencyName.toLowerCase().includes('hotel')) {
                      authHook.setAgencyName('');
                    }
                  }}
                >
                  <Text style={[styles.segmentBtnText, authHook.userType === 'agency' && styles.segmentBtnTextActive]}>✈️ Travel Agency</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.segmentBtn, authHook.userType === 'hotel' && styles.segmentBtnActive]}
                  onPress={() => {
                    authHook.setUserType('hotel');
                    if (authHook.agencyName.toLowerCase().includes('travels')) {
                      authHook.setAgencyName('');
                    }
                  }}
                >
                  <Text style={[styles.segmentBtnText, authHook.userType === 'hotel' && styles.segmentBtnTextActive]}>🏨 Hotel / Stay</Text>
                </TouchableOpacity>
              </View>

              {authHook.userType === 'agency' ? (
                <>
                  <Text style={styles.inputLabel}>Travel Agency Name</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. Swastik Travels Delhi"
                    placeholderTextColor="#9ca3af"
                    value={authHook.agencyName}
                    onChangeText={authHook.setAgencyName}
                  />
                  
                  <Text style={styles.inputLabel}>Business Focus</Text>
                  <View style={styles.segmentedContainer}>
                    <TouchableOpacity 
                      style={[styles.segmentBtn, authHook.agencyType === 'b2c' && styles.segmentBtnActiveB2C]}
                      onPress={() => authHook.setAgencyType('b2c')}
                    >
                      <Text style={[styles.segmentBtnText, authHook.agencyType === 'b2c' && styles.segmentBtnTextActive]}>B2C (Direct)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.segmentBtn, authHook.agencyType === 'b2b' && styles.segmentBtnActiveB2B]}
                      onPress={() => authHook.setAgencyType('b2b')}
                    >
                      <Text style={[styles.segmentBtnText, authHook.agencyType === 'b2b' && styles.segmentBtnTextActive]}>B2B (Agent)</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Specializations</Text>
                  <View style={styles.chipsContainer}>
                    {specializationOptions.map((spec) => {
                      const isSelected = authHook.specializations.includes(spec);
                      return (
                        <TouchableOpacity
                          key={spec}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => authHook.toggleSpecialization(spec)}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {isSelected ? '✓ ' : ''}{spec}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Hotel / Property Name</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="e.g. Grand Palace Resort"
                    placeholderTextColor="#9ca3af"
                    value={authHook.agencyName}
                    onChangeText={authHook.setAgencyName}
                  />

                  <Text style={styles.inputLabel}>Property Category</Text>
                  <View style={styles.chipsContainer}>
                    {hotelCategories.map((cat) => {
                      const isSelected = authHook.hotelCategory === cat.value;
                      return (
                        <TouchableOpacity
                          key={cat.value}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => authHook.setHotelCategory(cat.value)}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.inputLabel}>City</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g. New Delhi"
                placeholderTextColor="#9ca3af"
                value={authHook.city}
                onChangeText={authHook.setCity}
              />

              <Text style={styles.inputLabel}>GSTIN / Reg No. (Optional)</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g. 07AAAAA1111A1Z1"
                placeholderTextColor="#9ca3af"
                value={authHook.gstin}
                onChangeText={authHook.setGstin}
                autoCapitalize="characters"
              />
            </>
          )}

          {authHook.authMode === 'signup' && (
            <>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g. contact@agency.com"
                placeholderTextColor="#9ca3af"
                value={authHook.email}
                onChangeText={authHook.setEmail}
                keyboardType={Platform.OS === 'web' ? 'default' : 'email-address'}
                autoCapitalize="none"
              />
            </>
          )}

          <Text style={styles.inputLabel}>Mobile Number</Text>
          <TextInput 
            style={styles.input}
            placeholder="10-digit mobile number"
            placeholderTextColor="#9ca3af"
            value={authHook.phone}
            onChangeText={(text) => {
              const newVal = text.replace(/[^0-9]/g, '');
              authHook.setPhone(newVal);
              if (newVal.length === 10 && authHook.pinRefs && authHook.pinRefs[0] && authHook.pinRefs[0].current) {
                authHook.pinRefs[0].current.focus();
              }
            }}
            keyboardType="numeric"
            inputMode="numeric"
            maxLength={10}
          />

          <Text style={styles.inputLabel}>{authHook.authMode === 'signup' ? 'Set 6-Digit PIN' : '6-Digit PIN'}</Text>
          <View style={styles.pinInputContainer}>
            {authHook.pinValues.map((val, index) => (
              <TextInput
                key={index}
                ref={authHook.pinRefs[index]}
                style={styles.pinInputBox}
                value={val}
                onChangeText={(text) => {
                  const newVal = text.replace(/[^0-9]/g, '');
                  const newPinValues = [...authHook.pinValues];
                  newPinValues[index] = newVal.slice(-1);
                  authHook.setPinValues(newPinValues);
                  
                  // Auto-focus next field
                  if (newVal && index < 5) {
                    authHook.pinRefs[index + 1].current.focus();
                  } else if (newVal && index === 5) {
                    Keyboard.dismiss();
                  }
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') {
                    if (!authHook.pinValues[index] && index > 0) {
                      const newPinValues = [...authHook.pinValues];
                      newPinValues[index - 1] = '';
                      authHook.setPinValues(newPinValues);
                      authHook.pinRefs[index - 1].current.focus();
                    }
                  }
                }}
                keyboardType="numeric"
                inputMode="numeric"
                maxLength={1}
                secureTextEntry
                textAlign="center"
              />
            ))}
          </View>
          
          <TouchableOpacity style={styles.loginBtn} onPress={authHook.handleAuth}>
            <Text style={styles.loginBtnText}>
              {authHook.authMode === 'login' ? 'Secure Log In' : 'Register Agency'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 8 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>
              {authHook.authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                authHook.setAuthMode(authHook.authMode === 'login' ? 'signup' : 'login');
                authHook.setPhone('');
                authHook.setPinValues(['', '', '', '', '', '']);
              }}
            >
              <Text style={{ color: '#0ea5e9', fontSize: 14, fontWeight: 'bold' }}>
                {authHook.authMode === 'login' ? 'Sign up' : 'Log in'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.disclaimer}>
          Fully encrypted. Designed exclusively for registered travel partners in India.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
