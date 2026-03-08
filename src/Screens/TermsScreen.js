import React, {useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import STRING from '../Services/Constants/STRINGS';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

// ─── TermsScreen ───────────────────────────────────────────────────────────────

const TermsScreen = ({navigation}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          navigation.navigate(STRING.SCREEN.SETTINGS);
          return true;
        },
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate(STRING.SCREEN.SETTINGS)}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={18} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('TERMS_SCREEN.TITLE')}</Text>
      </View>
      <View style={styles.headerCurve} />

      {/* Content — legal document, intentionally in English */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>Terms of Service for TourKokan</Text>
        <Text style={styles.updated}>Effective date: 1 October 2024</Text>

        <Text style={styles.paragraph}>
          Please read these Terms of Service ("Terms") carefully before using
          the TourKokan mobile application ("App") operated by Probyte Solution
          LLP ("us", "we", or "our").
        </Text>
        <Text style={styles.paragraph}>
          Your access to and use of the App is conditioned on your acceptance
          of and compliance with these Terms. These Terms apply to all visitors,
          users, and others who access or use the App.
        </Text>

        <Text style={styles.subheading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using our App, you agree to be bound by these Terms.
          If you disagree with any part of the Terms, you may not access the App.
        </Text>

        <Text style={styles.subheading}>2. Use of the App</Text>
        <Text style={styles.paragraph}>
          TourKokan grants you a limited, non-exclusive, non-transferable, and
          revocable license to use the App for your personal, non-commercial
          purposes. You agree not to use the App for any unlawful purpose or in
          any way that could damage, disable, overburden, or impair our servers
          or networks.
        </Text>
        <Text style={styles.listItem}>
          • You must not reproduce, duplicate, copy, sell, resell, or exploit
          any portion of the App without express written permission.
        </Text>
        <Text style={styles.listItem}>
          • You must not attempt to gain unauthorised access to any portion of
          the App or any other systems or networks connected to the App.
        </Text>
        <Text style={styles.listItem}>
          • You must not use the App in any manner that could interfere with,
          disrupt, negatively affect, or inhibit other users from fully enjoying
          the App.
        </Text>

        <Text style={styles.subheading}>3. User Accounts</Text>
        <Text style={styles.paragraph}>
          When you create an account with us, you must provide accurate,
          complete, and current information. You are responsible for safeguarding
          the password that you use to access the App and for any activities or
          actions under your password. You agree not to disclose your password
          to any third party.
        </Text>

        <Text style={styles.subheading}>4. Content</Text>
        <Text style={styles.paragraph}>
          Our App may allow you to post, link, store, share, and otherwise make
          available certain information, text, graphics, or other material
          ("Content"). You are responsible for the Content that you post to the
          App, including its legality, reliability, and appropriateness.
        </Text>
        <Text style={styles.paragraph}>
          By posting Content to the App, you grant us the right and license to
          use, modify, publicly perform, publicly display, reproduce, and
          distribute such Content on and through the App.
        </Text>

        <Text style={styles.subheading}>5. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The App and its original content (excluding Content provided by
          users), features, and functionality are and will remain the exclusive
          property of Probyte Solution LLP and its licensors. The App is
          protected by copyright, trademark, and other laws. Our trademarks and
          trade dress may not be used in connection with any product or service
          without the prior written consent of Probyte Solution LLP.
        </Text>

        <Text style={styles.subheading}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          In no event shall TourKokan, nor its directors, employees, partners,
          agents, suppliers, or affiliates, be liable for any indirect,
          incidental, special, consequential, or punitive damages, including
          without limitation, loss of profits, data, use, goodwill, or other
          intangible losses, resulting from your access to or use of (or
          inability to access or use) the App.
        </Text>

        <Text style={styles.subheading}>7. Disclaimer of Warranties</Text>
        <Text style={styles.paragraph}>
          The App is provided on an "AS IS" and "AS AVAILABLE" basis without
          any warranties of any kind, either express or implied, including but
          not limited to implied warranties of merchantability, fitness for a
          particular purpose, or non-infringement.
        </Text>

        <Text style={styles.subheading}>8. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms shall be governed and construed in accordance with the
          laws of India, without regard to its conflict of law provisions. Any
          disputes arising under these Terms shall be subject to the exclusive
          jurisdiction of the courts located in Sindhudurg, Maharashtra, India.
        </Text>

        <Text style={styles.subheading}>9. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. If a revision is material, we will try to
          provide at least 30 days' notice prior to any new terms taking effect.
          What constitutes a material change will be determined at our sole
          discretion.
        </Text>
        <Text style={styles.paragraph}>
          By continuing to access or use our App after those revisions become
          effective, you agree to be bound by the revised Terms. If you do not
          agree to the new Terms, please stop using the App.
        </Text>

        <Text style={styles.subheading}>10. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at{' '}
          <Text style={styles.link}>support@tourkokan.com</Text>
        </Text>

        <Text style={styles.footer}>
          This document was last updated on 1 October 2024.
        </Text>
      </ScrollView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.cream},
  flex: {flex: 1},

  header: {
    backgroundColor: C.oceanDeep,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  headerCurve: {
    height: 36,
    backgroundColor: C.cream,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    marginTop: -36,
    zIndex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
  },

  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 6,
    lineHeight: 28,
  },
  updated: {
    fontSize: 12,
    color: C.textLight,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textDark,
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 22,
  },
  paragraph: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 22,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 4,
  },
  link: {
    color: '#1B6B7B',
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: C.textLight,
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default TermsScreen;
