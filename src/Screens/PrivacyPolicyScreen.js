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

// ─── PrivacyPolicyScreen ───────────────────────────────────────────────────────

const PrivacyPolicyScreen = ({navigation}) => {
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
        <Text style={styles.headerTitle}>{t('PRIVACY_POLICY_SCREEN.TITLE')}</Text>
      </View>
      <View style={styles.headerCurve} />

      {/* Content — legal document, intentionally in English */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>Privacy Policy for TourKokan</Text>

        <Text style={styles.paragraph}>
          TourKokan is committed to protecting the privacy of its users. This
          Privacy Policy governs the manner in which TourKokan collects, uses,
          maintains, and discloses information collected from users (each, a
          "User") of the TourKokan mobile application ("App").
        </Text>

        <Text style={styles.subheading}>
          Information We Collect &amp; Google Sign-In
        </Text>
        <Text style={styles.paragraph}>
          The App may collect certain personally identifiable information from
          Users in a variety of ways, including, but not limited to, when Users
          visit our App, register on the App, and in connection with other
          activities, services, features, or resources we make available on our
          App. Users may be asked for, as appropriate, name, email address,
          profile picture, and other relevant information. We will collect
          personal identification information from Users only if they voluntarily
          submit such information to us.
        </Text>
        <Text style={styles.paragraph}>
          If you choose to sign in to our App using Google Sign-In, we may
          collect personal information from your Google account, including your
          name, email address, and profile picture. This information is used to
          create and manage your account within the App and to provide you with a
          personalized experience. We will only collect the data you provide
          through the Google Sign-In process with your explicit consent.
        </Text>
        <Text style={styles.paragraph}>
          The information collected through Google Sign-In is governed by this
          Privacy Policy and Google's Privacy Policy. We do not share this
          information with any third-party services except as required to operate
          the App, comply with legal obligations, or as otherwise described in
          this Privacy Policy.
        </Text>

        <Text style={styles.subheading}>Usage Data</Text>
        <Text style={styles.paragraph}>
          We may also collect information that your device sends whenever you
          visit our App ("Usage Data"). This Usage Data may include information
          such as your device's Internet Protocol ("IP") address, device type,
          device operating system version, the pages of our App that you visit,
          the time and date of your visit, the time spent on those pages, and
          other statistics.
        </Text>

        <Text style={styles.subheading}>Location Data</Text>
        <Text style={styles.paragraph}>
          With your consent, we may collect and process information about your
          actual location. We use various technologies to determine location,
          including IP address, GPS, and other sensors that may provide
          information on nearby devices, Wi-Fi access points, and cell towers.
        </Text>

        <Text style={styles.subheading}>Cookies and Tracking Technologies</Text>
        <Text style={styles.paragraph}>
          We use cookies and similar tracking technologies to track the activity
          on our App and hold certain information. Cookies are files with a small
          amount of data which may include an anonymous unique identifier. You
          can instruct your device to refuse all cookies or to indicate when a
          cookie is being sent. However, if you do not accept cookies, you may
          not be able to use some portions of our App. We will obtain your
          consent before using cookies, as required by applicable laws.
        </Text>

        <Text style={styles.subheading}>Use of Information</Text>
        <Text style={styles.paragraph}>
          TourKokan may collect and use Users' personal information for the
          following purposes:
        </Text>
        <Text style={styles.listItem}>
          • To improve customer service: Information you provide helps us respond
          to your customer service requests and support needs more efficiently.
        </Text>
        <Text style={styles.listItem}>
          • To personalize user experience: We may use information in the
          aggregate to understand how our Users as a group use the services and
          resources provided on our App.
        </Text>
        <Text style={styles.listItem}>
          • To improve our App: We continually strive to improve our App
          offerings based on the information and feedback we receive from you.
        </Text>
        <Text style={styles.listItem}>
          • To send periodic emails: We may use the email address to respond to
          inquiries, questions, and/or other requests.
        </Text>
        <Text style={styles.listItem}>
          • To process transactions: We may use the information Users provide
          about themselves when placing an order only to provide service to that
          order. We do not share this information with outside parties except to
          the extent necessary to provide the service.
        </Text>
        <Text style={styles.listItem}>
          • To manage user accounts: We may use the information to manage user
          accounts and provide a seamless experience across devices and sessions.
        </Text>

        <Text style={styles.subheading}>How We Protect Your Information</Text>
        <Text style={styles.paragraph}>
          We adopt appropriate data collection, storage, and processing practices
          and security measures to protect against unauthorized access,
          alteration, disclosure, or destruction of your personal information,
          username, password, transaction information, and data stored on our
          App. Sensitive and private data exchange between the App and its Users
          happens over a secured communication channel and is encrypted and
          protected with digital signatures.
        </Text>

        <Text style={styles.subheading}>Sharing Your Personal Information</Text>
        <Text style={styles.paragraph}>
          We do not sell, trade, or rent Users' personal identification
          information to others. We may share generic aggregated demographic
          information not linked to any personal identification information
          regarding visitors and users with our business partners, trusted
          affiliates, and advertisers for the purposes outlined above.
        </Text>

        <Text style={styles.subheading}>Retention of Data</Text>
        <Text style={styles.paragraph}>
          We will retain your personal information only for as long as is
          necessary for the purposes set out in this Privacy Policy. We will
          retain and use your personal information to the extent necessary to
          comply with our legal obligations, resolve disputes, and enforce our
          legal agreements and policies.
        </Text>

        <Text style={styles.subheading}>Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          TourKokan has the discretion to update this privacy policy at any time.
          When we do, we will post a notification on the main page of our App.
          We encourage Users to frequently check this page for any changes to
          stay informed about how we are helping to protect the personal
          information we collect.
        </Text>

        <Text style={styles.subheading}>Your Acceptance of These Terms</Text>
        <Text style={styles.paragraph}>
          By using this App, you signify your acceptance of this policy. If you
          do not agree to this policy, please do not use our App. Your continued
          use of the App following the posting of changes to this policy will be
          deemed your acceptance of those changes.
        </Text>

        <Text style={styles.subheading}>Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, the practices of
          this App, or your dealings with this App, please contact us at{' '}
          <Text style={styles.link}>support@tourkokan.com</Text>
        </Text>

        <Text style={styles.updated}>
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
    marginBottom: 16,
    lineHeight: 28,
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
  updated: {
    fontSize: 12,
    color: C.textLight,
    marginTop: 24,
    fontStyle: 'italic',
  },
});

export default PrivacyPolicyScreen;
