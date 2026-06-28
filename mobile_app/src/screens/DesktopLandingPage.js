import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

const DesktopLandingPage = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          <Text style={{ fontWeight: '300' }}>trav</Text>
          <Text style={{ fontWeight: '900', color: '#0ea5e9' }}>hub</Text>
        </Text>
        <View style={styles.navLinks}>
          <Text style={styles.navLink}>Home</Text>
          <Text style={styles.navLink}>Features</Text>
          <Text style={styles.navLink}>About Us</Text>
          <Text style={styles.navLink}>Contact</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroLeft}>
          <Text style={styles.headline}>The Ultimate Network for Travel Professionals</Text>
          <Text style={styles.subheadline}>
            Connect with B2B suppliers, find exclusive deals, and grow your travel agency on our mobile platform.
          </Text>
          
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={{ fontSize: 48 }}>📱</Text>
            </View>
            <View style={styles.qrTextContainer}>
              <Text style={styles.qrTitle}>Experience the App</Text>
              <Text style={styles.qrSubtitle}>Open your camera and scan the QR code to install the TravHub PWA on your mobile phone for the best experience.</Text>
            </View>
          </View>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.phoneMockup}>
            <View style={styles.phoneScreen}>
               <Text style={styles.logoText}>
                 <Text style={{ fontWeight: '300' }}>trav</Text>
                 <Text style={{ fontWeight: '900', color: '#0ea5e9' }}>hub</Text>
               </Text>
               <Text style={{ color: '#64748b', marginTop: 20 }}>Mobile Experience</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why Choose TravHub?</Text>
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🤝</Text>
            <Text style={styles.featureTitle}>B2B Networking</Text>
            <Text style={styles.featureDesc}>Instantly connect with verified suppliers and agents across India.</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Real-time Deals</Text>
            <Text style={styles.featureDesc}>Get instant push notifications for the best B2C and B2B packages.</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Instant Chat</Text>
            <Text style={styles.featureDesc}>Negotiate prices and share documents securely within the app.</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 TravHub India. All rights reserved.</Text>
        <Text style={styles.footerSubText}>Designed for Mobile. Best experienced as a PWA.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b14',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 80,
    paddingVertical: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 28,
  },
  navLinks: {
    flexDirection: 'row',
    gap: 30,
  },
  navLink: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
    cursor: 'pointer',
  },
  heroSection: {
    flexDirection: 'row',
    paddingHorizontal: 80,
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 1400,
    alignSelf: 'center',
    minHeight: height * 0.8,
  },
  heroLeft: {
    flex: 1.2,
    paddingRight: 60,
  },
  heroRight: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 64,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 76,
    marginBottom: 24,
  },
  subheadline: {
    fontSize: 22,
    color: '#94a3b8',
    lineHeight: 34,
    marginBottom: 48,
    maxWidth: 600,
  },
  qrContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: 500,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  qrTextContainer: {
    flex: 1,
  },
  qrTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  qrSubtitle: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
  },
  phoneMockup: {
    width: 340,
    height: 680,
    backgroundColor: '#1e293b',
    borderRadius: 44,
    borderWidth: 14,
    borderColor: '#0f172a',
    overflow: 'hidden',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#050b14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresSection: {
    paddingVertical: 100,
    paddingHorizontal: 80,
    backgroundColor: '#0a101d',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 60,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 40,
    maxWidth: 1200,
    justifyContent: 'center',
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  featureDesc: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerText: {
    color: '#64748b',
    fontSize: 15,
    marginBottom: 8,
  },
  footerSubText: {
    color: '#475569',
    fontSize: 13,
  }
});

export default DesktopLandingPage;
