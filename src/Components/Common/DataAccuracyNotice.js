/**
 * DataAccuracyNotice — the "help us make this accurate" popup shown on the
 * MSRTC / bus-route screens.
 *
 * Much of the route data was added in bulk, so it carries mistakes. Rather than
 * hide that, the app says so and invites the people best placed to fix it.
 *
 * Shown ONCE PER SCREEN PER INSTALL, not on every visit: the users most likely
 * to contribute are the ones who open these screens repeatedly, and they are
 * exactly the people a repeating modal would drive away. Each screen passes its
 * own `storageKey` so a user who only ever opens Route Details still sees it
 * once there.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createLogger} from '../../Services/Logger';
import {shadow} from '../../Services/shadow';

const log = createLogger('DataAccuracyNotice');

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forest: '#1A3320',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  sand: '#C4972A',
  sandPale: '#FBF3DC',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  line: 'rgba(0,0,0,0.08)',
};

const PREFIX = 'dataNotice:v1:';

/** Each point gets its own icon so the three read as distinct ideas, not a wall. */
const POINTS = [
  {key: 'POINT_1', icon: 'alert-circle-outline', tint: '#C1492E'},
  {key: 'POINT_2', icon: 'construct-outline', tint: C.sand},
  {key: 'POINT_3', icon: 'heart-outline', tint: '#2E5C3A'},
];

/**
 * @param storageKey  unique per screen — what "seen once" is remembered against
 * @param onReport    opens the correction form
 * @param deferWhile  hold the notice back while another modal owns the screen.
 *                    Two RN Modals at once stack badly on Android and can fail
 *                    outright on iOS. The notice is NOT marked seen while
 *                    deferred, so it simply appears once the way is clear —
 *                    either as soon as the other modal closes, or next visit.
 */
const DataAccuracyNotice = ({storageKey, onReport, deferWhile = false}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  // null = still reading storage, so nothing flashes before we know.
  const [seen, setSeen] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const flag = await AsyncStorage.getItem(PREFIX + storageKey);
        if (alive) setSeen(!!flag);
      } catch (e) {
        // Storage unavailable is not a reason to nag — stay quiet.
        log.warn('[notice] could not read seen flag', e);
        if (alive) setSeen(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [storageKey]);

  const dismiss = useCallback(async () => {
    setSeen(true);
    try {
      await AsyncStorage.setItem(PREFIX + storageKey, '1');
    } catch (e) {
      log.warn('[notice] could not persist seen flag', e);
    }
  }, [storageKey]);

  const report = useCallback(() => {
    dismiss();
    onReport?.();
  }, [dismiss, onReport]);

  if (seen !== false || deferWhile) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}>
      <View style={s.backdrop}>
        <View style={[s.card, {marginBottom: insets.bottom}]}>
          <LinearGradient
            colors={[C.oceanDeep, C.forest]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={s.head}>
            <View style={s.headIcon}>
              <Ionicons name="bus-outline" size={22} color={C.white} />
            </View>
            <Text style={s.title}>{t('DATA_NOTICE.TITLE')}</Text>
            <TouchableOpacity
              style={s.close}
              onPress={dismiss}
              activeOpacity={0.8}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="close" size={18} color={C.white} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}>
            <Text style={s.intro}>{t('DATA_NOTICE.INTRO')}</Text>

            {POINTS.map(p => (
              <View key={p.key} style={s.point}>
                <View style={[s.pointIcon, {backgroundColor: `${p.tint}18`}]}>
                  <Ionicons name={p.icon} size={17} color={p.tint} />
                </View>
                <Text style={s.pointText}>{t(`DATA_NOTICE.${p.key}`)}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={s.actions}>
            <TouchableOpacity style={s.secondary} onPress={dismiss} activeOpacity={0.85}>
              <Text style={s.secondaryText}>{t('DATA_NOTICE.GOT_IT')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.primary} onPress={report} activeOpacity={0.9}>
              <Ionicons name="create-outline" size={16} color={C.white} />
              <Text style={s.primaryText}>{t('DATA_NOTICE.REPORT_BTN')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,20,22,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: C.cream,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '82%',
    ...shadow(12),
  },
  head: {paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16},
  headIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: -0.2,
    paddingRight: 28,
    lineHeight: 24,
  },
  close: {position: 'absolute', top: 14, right: 12, padding: 4},

  body: {flexGrow: 0},
  bodyContent: {padding: 18, paddingBottom: 6},
  intro: {fontSize: 14, lineHeight: 21, color: C.textMid, marginBottom: 16},

  point: {flexDirection: 'row', gap: 11, marginBottom: 14},
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pointText: {flex: 1, fontSize: 13.5, lineHeight: 20, color: C.textDark},

  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  secondary: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(13,61,74,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {fontSize: 14, fontWeight: '700', color: C.oceanDeep},
  primary: {
    flex: 1.4,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.oceanMid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryText: {fontSize: 14, fontWeight: '700', color: C.white},
});

export default DataAccuracyNotice;
