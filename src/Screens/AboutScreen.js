import React, {useEffect} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
  BackHandler,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import VersionCheck from 'react-native-version-check';
import {scaleFontSizes} from '../Services/responsive';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  oceanFoam: '#B8E4EA',
  sandMid: '#C4972A',
  earthMid: '#6B4226',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

const FEATURES = [
  {icon: '📍', labelKey: 'FEAT_1'},
  {icon: '⭐', labelKey: 'FEAT_2'},
  {icon: '🗺️', labelKey: 'FEAT_3'},
  {icon: '🚌', labelKey: 'FEAT_4'},
  {icon: '🏪', labelKey: 'FEAT_5'},
  {icon: '🌱', labelKey: 'FEAT_6'},
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({children}) => (
  <View style={ab.sectionTitleRow}>
    <View style={ab.sectionTitleBar} />
    <Text style={ab.sectionTitleText}>{children}</Text>
  </View>
);

const SectionCard = ({children, style}) => (
  <View style={[ab.sectionCard, style]}>{children}</View>
);

const VisionCard = ({icon, title, text}) => (
  <View style={ab.visionCard}>
    <View style={ab.visionTitleRow}>
      <Text style={ab.visionIcon}>{icon}</Text>
      <Text style={ab.visionTitle}>{title}</Text>
    </View>
    <Text style={ab.visionText}>{text}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const AboutScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const version = VersionCheck.getCurrentVersion();

  // Hardware back button (Android)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  const openEmail = () => {
    Linking.openURL('mailto:support@tourkokan.com').catch(() => {});
  };

  const handleShare = () => {
    Share.share({
      message: t('ABOUT_SCREEN.SHARE_MSG', {
        defaultValue:
          'Explore the beautiful Kokan region with Tourkokan! 🏖️ Download the app and start your journey.',
      }),
    }).catch(() => {});
  };

  return (
    <View style={ab.root}>
      {/* Status bar follows hero sand theme */}
      <SystemBars style="light" />

      {/* Status bar area fill — matches hero colour */}
      <View style={[ab.statusFill, {height: insets.top, backgroundColor: C.sandMid}]} />

      <ScrollView
        style={ab.scroll}
        contentContainerStyle={ab.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero Header ── */}
        <View style={[ab.hero, {paddingTop: insets.top + 8}]}>
          <View style={ab.heroOverlay} pointerEvents="none" />

          <TouchableOpacity
            style={ab.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>

          <Image
            source={require('../Assets/Images/Logos/tourkokan-logo.png')}
            style={ab.heroLogo}
            resizeMode="contain"
          />
          <Text style={ab.heroTagline}>{t('DRAWER.TAGLINE')}</Text>
        </View>

        {/* ── Content ── */}
        <View style={ab.content}>

          {/* Welcome */}
          <View style={ab.welcomeCard}>
            <Text style={ab.welcomeTitle}>{t('ABOUT_SCREEN.WELCOME_TITLE')}</Text>
            <Text style={ab.welcomeText}>{t('ABOUT_SCREEN.WELCOME_TEXT')}</Text>
          </View>

          {/* Discover Kokan */}
          <SectionCard>
            <Text style={ab.sectionIcon}>🌊</Text>
            <SectionTitle>{t('ABOUT_SCREEN.DISCOVER_TITLE')}</SectionTitle>
            <Text style={ab.bodyText}>{t('ABOUT_SCREEN.DISCOVER_TEXT1')}</Text>
            <Text style={[ab.bodyText, {marginTop: 8}]}>{t('ABOUT_SCREEN.DISCOVER_TEXT2')}</Text>
          </SectionCard>

          {/* Vision */}
          <VisionCard
            icon="🎯"
            title={t('ABOUT_SCREEN.VISION_TITLE')}
            text={t('ABOUT_SCREEN.VISION_TEXT')}
          />

          {/* Mission */}
          <VisionCard
            icon="🚀"
            title={t('ABOUT_SCREEN.MISSION_TITLE')}
            text={t('ABOUT_SCREEN.MISSION_TEXT')}
          />

          {/* Why Choose */}
          <SectionCard>
            <SectionTitle>{t('ABOUT_SCREEN.WHY_TITLE')}</SectionTitle>
            <Text style={ab.bodyText}>{t('ABOUT_SCREEN.WHY_SUB')}</Text>
            <View style={ab.featureList}>
              {FEATURES.map((f, i) => (
                <View key={i} style={ab.featureRow}>
                  <Text style={ab.featureIcon}>{f.icon}</Text>
                  <Text style={ab.featureText}>{t(`ABOUT_SCREEN.${f.labelKey}`)}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          {/* Our Commitment */}
          <SectionCard>
            <Text style={ab.sectionIcon}>💙</Text>
            <SectionTitle>{t('ABOUT_SCREEN.COMMITMENT_TITLE')}</SectionTitle>
            <Text style={ab.bodyText}>{t('ABOUT_SCREEN.COMMITMENT_TEXT1')}</Text>
            <Text style={[ab.bodyText, {marginTop: 8}]}>{t('ABOUT_SCREEN.COMMITMENT_TEXT2')}</Text>
          </SectionCard>

          {/* CTA Card */}
          <View style={ab.ctaCard}>
            <Text style={ab.ctaTitle}>{t('ABOUT_SCREEN.CTA_TITLE')}</Text>
            <Text style={ab.ctaText}>{t('ABOUT_SCREEN.CTA_TEXT')}</Text>
            <TouchableOpacity style={ab.ctaBtn} onPress={handleShare} activeOpacity={0.85}>
              <Text style={ab.ctaBtnIcon}>📝</Text>
              <Text style={ab.ctaBtnText}>{t('ABOUT_SCREEN.CTA_BTN')}</Text>
            </TouchableOpacity>
          </View>

          {/* Write to Us */}
          <SectionCard style={ab.centerCard}>
            <Text style={ab.writeTitle}>{t('ABOUT_SCREEN.WRITE_TITLE')}</Text>
            <Text style={[ab.bodyText, {textAlign: 'center', marginBottom: 16}]}>
              {t('ABOUT_SCREEN.WRITE_TEXT')}
            </Text>
            <TouchableOpacity style={ab.emailCard} onPress={openEmail} activeOpacity={0.8}>
              <Text style={ab.emailIcon}>✉️</Text>
              <Text style={ab.emailText}>{t('ABOUT_SCREEN.EMAIL')}</Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Footer */}
          <View style={[ab.footer, {paddingBottom: insets.bottom + 24}]}>
            <Text style={ab.footerVersion}>{t('APPNAME')} v{version}</Text>
            <Text style={ab.footerMade}>{t('ABOUT_SCREEN.MADE_WITH')}</Text>
            <Text style={ab.footerEmpowering}>{t('ABOUT_SCREEN.EMPOWERING')}</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const ab = StyleSheet.create(scaleFontSizes({
  root: {flex: 1, backgroundColor: C.sandMid},
  statusFill: {position: 'absolute', top: 0, left: 0, right: 0},
  scroll: {flex: 1},
  scrollContent: {flexGrow: 1, backgroundColor: C.cream},

  // ── Hero ──
  hero: {
    backgroundColor: C.sandMid,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(107,66,38,0.35)',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  heroLogo: {width: 110, height: 110, marginBottom: 10},
  heroTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    fontStyle: 'italic',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Content ──
  content: {paddingHorizontal: 16, paddingTop: 16},

  // Welcome card
  welcomeCard: {
    backgroundColor: 'rgba(184,228,234,0.18)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(27,107,123,0.2)',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.oceanDeep,
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeText: {fontSize: 14, lineHeight: 22, color: C.textMid, textAlign: 'center'},

  // Section card — border only, no shadow/elevation
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  centerCard: {alignItems: 'center'},
  sectionIcon: {fontSize: 36, textAlign: 'center', marginBottom: 10},

  // Section title with left bar
  sectionTitleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  sectionTitleBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: C.oceanMid,
    marginRight: 10,
  },
  sectionTitleText: {fontSize: 17, fontWeight: '700', color: C.textDark, flex: 1},

  bodyText: {fontSize: 13, lineHeight: 21, color: C.textMid},

  // Vision card
  visionCard: {
    backgroundColor: 'rgba(27,107,123,0.06)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(27,107,123,0.15)',
  },
  visionTitleRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8},
  visionIcon: {fontSize: 20},
  visionTitle: {fontSize: 15, fontWeight: '700', color: C.oceanDeep},
  visionText: {fontSize: 13, lineHeight: 21, color: C.textMid},

  // Feature list
  featureList: {marginTop: 12, gap: 8},
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(184,228,234,0.1)',
    borderRadius: 10,
    padding: 10,
  },
  featureIcon: {fontSize: 18, marginTop: 1},
  featureText: {flex: 1, fontSize: 13, lineHeight: 20, color: C.textMid, fontWeight: '500'},

  // CTA card — border only
  ctaCard: {
    backgroundColor: C.sandMid,
    borderRadius: 18,
    padding: 24,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196,151,42,0.4)',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(196,151,42,0.3)',
  },
  ctaBtnIcon: {fontSize: 16},
  ctaBtnText: {fontSize: 14, fontWeight: '700', color: C.sandMid},

  // Write to us
  writeTitle: {fontSize: 16, fontWeight: '700', color: C.textDark, marginBottom: 10},
  emailCard: {
    borderWidth: 2,
    borderColor: C.oceanMid,
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(27,107,123,0.05)',
  },
  emailIcon: {fontSize: 44, marginBottom: 10},
  emailText: {fontSize: 15, fontWeight: '600', color: C.oceanMid, letterSpacing: 0.3},

  // Footer
  footer: {alignItems: 'center', paddingTop: 24, paddingHorizontal: 16},
  footerVersion: {fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 4},
  footerMade: {fontSize: 12, color: C.textLight, marginBottom: 4, textAlign: 'center'},
  footerEmpowering: {
    fontSize: 10,
    color: C.textLight,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
}));

export default AboutScreen;
