import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  BackHandler,
  Linking,
  Platform,
  UIManager,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import STRING from '../Services/Constants/STRINGS';
import {scaleFontSizes, useResponsive} from '../Services/responsive';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  border: 'rgba(0,0,0,0.07)',
  activePill: '#1B6B7B',
  activePillText: '#FFFFFF',
  inactivePill: '#FFFFFF',
  inactivePillText: '#44403C',
  inactivePillBorder: 'rgba(0,0,0,0.1)',
};

// ─── FAQ data — matches website content exactly ────────────────────────────────

const FAQ_EN = [
  {
    category: 'Getting Started',
    icon: '🚀',
    items: [
      {
        q: 'What is Tourkokan?',
        a: 'Tourkokan is your guide to exploring the Konkan coast of Maharashtra. We list beaches, forts, waterfalls, temples, and local events to help travellers discover hidden gems along the coast.',
      },
      {
        q: 'Do I need an account to browse destinations?',
        a: 'You can browse the home page freely. To explore destinations, events, gallery, and bus routes in detail, you need a quick guest account — it takes just one tap and no password is required.',
      },
      {
        q: 'Is Tourkokan free to use?',
        a: 'Yes, Tourkokan is completely free for travellers. You can explore all destinations, events, and routes without any charges.',
      },
    ],
  },
  {
    category: 'Guest Account',
    icon: '👤',
    items: [
      {
        q: 'What is a guest account?',
        a: 'A guest account is a temporary session created for you automatically. It lets you access all features — saving places, viewing details, and more — without signing up with an email.',
      },
      {
        q: 'How long does a guest session last?',
        a: 'Guest sessions are valid for 24 hours. After that you can simply create a new guest session.',
      },
      {
        q: 'Can I upgrade from a guest account to a full account?',
        a: 'Yes! Register with your email or mobile number from the login screen to get a permanent account with features like wallet points, event creation, and place submission.',
      },
    ],
  },
  {
    category: 'Destinations',
    icon: '📍',
    items: [
      {
        q: 'How do I find a specific beach or fort?',
        a: 'Go to the search tab and type the name. You can also browse by Category (Beach, Fort, Waterfall, Temple, etc.) to narrow down results.',
      },
      {
        q: 'How do I save a place for later?',
        a: 'Tap the heart icon on any destination detail page to save it to your favourites.',
      },
      {
        q: 'Can I add a place that is not listed?',
        a: 'Yes! Use the "Submit a Place" option in your profile to suggest a new destination. Our team reviews all submissions before publishing.',
      },
    ],
  },
  {
    category: 'Bus Routes',
    icon: '🚌',
    items: [
      {
        q: 'How do I find a bus route between two places?',
        a: 'Go to the Routes tab, enter your departure point in "From" and your destination in "To", then tap Search.',
      },
      {
        q: 'Are the bus timings accurate?',
        a: 'We try to keep timings updated, but schedules can change. We recommend confirming at the local ST bus stand for the most current information.',
      },
    ],
  },
  {
    category: 'Events',
    icon: '🎪',
    items: [
      {
        q: 'How do I find upcoming festivals in Kokan?',
        a: 'Open the Events tab and use the search or filters. Use the "Featured" filter to see the biggest upcoming events, or search by festival name.',
      },
      {
        q: 'How can I submit an event?',
        a: 'Tap "My Events" in your profile to create and manage events. You need to be registered as a vendor — request the vendor role from your profile page.',
      },
    ],
  },
  {
    category: 'Advertising',
    icon: '📢',
    items: [
      {
        q: 'How can I advertise my business on Tourkokan?',
        a: 'Use the Advertise option in the app to see available packages. Fill out the enquiry form and our team will get back to you within 24 hours.',
      },
      {
        q: 'What types of businesses can advertise?',
        a: 'Hotels, homestays, restaurants, boat tours, water sports operators, and any business serving Konkan travellers can advertise on Tourkokan.',
      },
    ],
  },
];

const FAQ_MR = [
  {
    category: 'सुरुवात करूया',
    icon: '🚀',
    items: [
      {
        q: 'Tourkokan म्हणजे काय?',
        a: 'Tourkokan हे महाराष्ट्राच्या कोकण किनारपट्टीची सफर घडवून आणणारे तुमचे हक्काचे गाईड आहे. इथले अथांग किनारे, ऐतिहासिक किल्ले, मनमोहक धबधबे, प्राचीन मंदिरे आणि स्थानिक उत्सवांची इत्थंभूत माहिती देऊन कोकणचे दडलेले सौंदर्य उलगडण्यास आम्ही मदत करतो.',
      },
      {
        q: 'माहिती पाहण्यासाठी खाते असणे आवश्यक आहे का?',
        a: 'Tourkokan चे मुख्यपृष्ठ पाहण्यासाठी कोणत्याही खात्याची गरज नाही. पण ठिकाणे, कार्यक्रम, चित्रदालन आणि बस वेळापत्रक सविस्तर पाहण्यासाठी मोफत "गेस्ट अकाउंट" लागेल — हे फक्त एका क्लिकवर बनते.',
      },
      {
        q: 'Tourkokan वापरण्यासाठी पैसे लागतात का?',
        a: 'नाही, Tourkokan पर्यटकांसाठी अगदी मोफत आहे! इथली सर्व माहिती, ठिकाणे आणि मार्ग तुम्ही कोणत्याही शुल्काशिवाय पाहू शकता.',
      },
    ],
  },
  {
    category: 'गेस्ट अकाउंट',
    icon: '👤',
    items: [
      {
        q: 'गेस्ट अकाउंट म्हणजे काय?',
        a: 'गेस्ट अकाउंट हे तुमच्यासाठी आपोआप तयार झालेले एक तात्पुरते खाते आहे. यामुळे तुम्हाला ईमेल न देताही माहिती पाहता येते.',
      },
      {
        q: 'गेस्ट अकाउंट किती वेळ चालते?',
        a: 'गेस्ट अकाउंट तुम्ही साइन इन केल्यापासून फक्त २४ तासांसाठी वैध असते. त्यानंतर नवीन गेस्ट अकाउंट बनवता येते.',
      },
      {
        q: 'गेस्ट अकाउंटवरून कायमस्वरूपी खाते बनवता येते का?',
        a: 'होय! लॉगिन स्क्रीनवरून ईमेल किंवा मोबाईल नंबरने नोंदणी करा आणि वॉलेट पॉइंट्स, इव्हेंट तयार करणे यांसारख्या सुविधांचा लाभ घ्या.',
      },
    ],
  },
  {
    category: 'ठिकाणे',
    icon: '📍',
    items: [
      {
        q: 'एखादा विशिष्ट किनारा किंवा किल्ला कसा शोधायचा?',
        a: 'सर्च टॅबमध्ये जाऊन नाव टाईप करा. किंवा श्रेणी (Beach, Fort, Waterfall) निवडूनही शोध घेता येतो.',
      },
      {
        q: 'आवडलेली ठिकाणे जतन कशी करायची?',
        a: 'कोणत्याही ठिकाणाच्या माहितीवर असलेल्या "हार्ट" आयकॉनवर क्लिक करा.',
      },
      {
        q: 'अ‍ॅपवर नसलेले एखादे नवीन ठिकाण मी सुचवू शकतो का?',
        a: 'नक्कीच! प्रोफाइलमधील "नवीन ठिकाण सुचवा" पर्यायावर जाऊन माहिती द्या. आमची टीम तपासून प्रकाशित करेल.',
      },
    ],
  },
  {
    category: 'बस मार्ग',
    icon: '🚌',
    items: [
      {
        q: 'दोन ठिकाणांमधील बस मार्ग कसा शोधायचा?',
        a: 'Routes टॅबमध्ये जाऊन "येथून" आणि "येथे" मध्ये ठिकाणे निवडा आणि शोधा बटणावर क्लिक करा.',
      },
      {
        q: 'एसटीचे वेळापत्रक अचूक असते का?',
        a: 'आम्ही वेळापत्रक अचूक ठेवण्याचा प्रयत्न करतो. तरीही, प्रवासाला निघण्यापूर्वी स्थानिक एसटी स्टँडवर खात्री करून घ्या.',
      },
    ],
  },
  {
    category: 'कार्यक्रम',
    icon: '🎪',
    items: [
      {
        q: 'कोकणातील आगामी सण कसे शोधायचे?',
        a: '"कार्यक्रम" टॅबवर जाऊन फिल्टर वापरा. "खास आकर्षण" फिल्टर वापरून मोठ्या उत्सवांसाठी शोध घ्या.',
      },
      {
        q: 'एखाद्या स्थानिक कार्यक्रमाची माहिती कशी द्यायची?',
        a: 'प्रोफाइलमधील "माझे कार्यक्रम" वरून इव्हेंट तयार करता येतो. यासाठी व्हेंडर रोल असणे आवश्यक आहे.',
      },
    ],
  },
  {
    category: 'जाहिरात',
    icon: '📢',
    items: [
      {
        q: 'Tourkokan वर माझ्या व्यवसायाची जाहिरात कशी करायची?',
        a: 'अ‍ॅपमधील "जाहिरात करा" पर्यायावर जा. फॉर्म भरून पाठवा, आमची टीम २४ तासांत संपर्क साधेल.',
      },
      {
        q: 'कोणत्या प्रकारचे व्यवसाय जाहिरात करू शकतात?',
        a: 'हॉटेल्स, होमस्टे, रेस्टॉरंट्स, बोटिंग आणि कोकणात पर्यटकांना सेवा देणारे कोणतेही व्यवसाय.',
      },
    ],
  },
];

// ─── FaqItem ──────────────────────────────────────────────────────────────────

const FaqItem = ({q, a}) => {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <View style={s.faqItem}>
      <TouchableOpacity
        style={s.faqRow}
        onPress={toggle}
        activeOpacity={0.75}>
        <Text style={s.faqQ}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={C.textLight}
        />
      </TouchableOpacity>
      {open && <Text style={s.faqA}>{a}</Text>}
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const HelpCenterScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {isTablet} = useResponsive();
  const {t, i18n} = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  const faqData = i18n.language === 'mr' ? FAQ_MR : FAQ_EN;
  const current = faqData[activeTab];

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  const openContact = () => {
    navigation.navigate(STRING.SCREEN.CONTACT_US);
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@tourkokan.com').catch(() => {});
  };

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={[s.header, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="chevron-back" size={18} color={C.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('HELP_CENTER.TITLE')}</Text>
        <Text style={s.headerSubtitle}>{t('HELP_CENTER.SUBTITLE')}</Text>
      </View>
      <View style={s.headerCurve} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          {paddingBottom: insets.bottom + 32},
          isTablet && {maxWidth: 680, width: '100%', alignSelf: 'center'},
        ]}
        showsVerticalScrollIndicator={false}>

        {/* ── Category tab pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsRow}
          style={s.tabsScroll}>
          {faqData.map((section, i) => (
            <TouchableOpacity
              key={i}
              style={[s.tab, activeTab === i && s.tabActive]}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.75}>
              <Text style={s.tabIcon}>{section.icon}</Text>
              <Text style={[s.tabLabel, activeTab === i && s.tabLabelActive]}>
                {section.category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── FAQ accordion card ── */}
        {current && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardIcon}>{current.icon}</Text>
              <Text style={s.cardTitle}>{current.category}</Text>
            </View>
            <View style={s.divider} />
            {current.items.map((item, idx) => (
              <FaqItem key={idx} q={item.q} a={item.a} />
            ))}
          </View>
        )}

        {/* ── Still need help ── */}
        <View style={s.helpCard}>
          <Text style={s.helpEmoji}>💬</Text>
          <Text style={s.helpTitle}>{t('HELP_CENTER.STILL_NEED_HELP_TITLE')}</Text>
          <Text style={s.helpSubtext}>{t('HELP_CENTER.STILL_NEED_HELP_SUBTEXT')}</Text>
          <View style={s.helpBtnRow}>
            <TouchableOpacity
              style={s.helpBtnPrimary}
              onPress={openContact}
              activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={C.white} style={s.helpBtnIcon} />
              <Text style={s.helpBtnPrimaryText}>{t('HELP_CENTER.CONTACT_BTN')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.helpBtnSecondary}
              onPress={openEmail}
              activeOpacity={0.85}>
              <Ionicons name="mail-outline" size={16} color={C.oceanMid} style={s.helpBtnIcon} />
              <Text style={s.helpBtnSecondaryText}>{t('HELP_CENTER.EMAIL_BTN')}</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create(scaleFontSizes({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },

  // Header
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
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  headerCurve: {
    height: 36,
    backgroundColor: C.cream,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
    marginTop: -36,
    zIndex: 1,
  },

  // Scroll
  scroll: {flex: 1},
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Category tabs
  tabsScroll: {
    marginBottom: 16,
  },
  tabsRow: {
    paddingVertical: 4,
    paddingRight: 16,
    gap: 8,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.inactivePillBorder,
    backgroundColor: C.inactivePill,
    gap: 6,
  },
  tabActive: {
    backgroundColor: C.activePill,
    borderColor: C.activePill,
  },
  tabIcon: {fontSize: 14},
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.inactivePillText,
  },
  tabLabelActive: {
    color: C.activePillText,
    fontWeight: '600',
  },

  // FAQ card
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  cardIcon: {fontSize: 20},
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textDark,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginHorizontal: 20,
  },

  // FAQ item
  faqItem: {
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.textDark,
    lineHeight: 20,
  },
  faqA: {
    fontSize: 14,
    color: C.textLight,
    lineHeight: 22,
    paddingBottom: 16,
  },

  // Still need help card
  helpCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  helpEmoji: {fontSize: 36, marginBottom: 12},
  helpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textDark,
    marginBottom: 6,
  },
  helpSubtext: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  helpBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  helpBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.oceanMid,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 6,
  },
  helpBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
  helpBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.oceanMid,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 6,
  },
  helpBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.oceanMid,
  },
  helpBtnIcon: {
    marginRight: 2,
  },
}));

export default HelpCenterScreen;
