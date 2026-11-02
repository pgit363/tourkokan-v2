/**
 * Add a place the traveller found themselves, from a Google Maps link.
 *
 * ONE SCREEN, TWO OUTCOMES
 *
 * The designs separate "inside Sindhudurg" and "outside Sindhudurg" into two
 * boards, but they are the same screen holding a different answer. Splitting
 * them would mean a back stack where going back from the refusal lands on an
 * empty form and the traveller has to paste the link again — which is exactly
 * when they are least inclined to.
 *
 * WHY THE LINK GOES TO THE SERVER
 *
 * A maps.app.goo.gl link has no coordinates in it; only following the redirect
 * reveals them. And the question that decides the outcome — can we plan around
 * this point — is answered against the sites table, which lives on the server.
 *
 * WHAT AN OWN PLACE IS NOT
 *
 * It is stored on the trip, not in `sites`. It has no owner, no verification
 * and no phone number, and the screen says so before the traveller adds it —
 * otherwise the first missing "Call" button reads as a bug.
 */
import React, {useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import GlobalText from '../Components/Customs/Text';
import KeyboardSafe from '../Components/Common/KeyboardSafe';
import {C} from '../Components/Marketplace/theme';
import {resolveMapLink, addCustomStop} from '../Services/Api/TripServices';
import {backPage} from '../Services/CommonMethods';

const KINDS = [
  {code: 'beach', key: 'KIND_BEACH'},
  {code: 'fort', key: 'KIND_FORT'},
  {code: 'temple', key: 'KIND_TEMPLE'},
  {code: 'food', key: 'KIND_FOOD'},
  {code: 'stay', key: 'KIND_STAY'},
];

const Chip = ({label, on, onPress}) => (
  <TouchableOpacity
    style={[s.chip, on && s.chipOn]}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityState={{selected: on}}>
    <GlobalText text={label} style={[s.chipTxt, on && s.chipTxtOn]} />
  </TouchableOpacity>
);

const AddFromLinkScreen = ({navigation, route}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const tripId = route?.params?.tripId;

  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const check = async () => {
    if (!url.trim()) return;
    setChecking(true);
    setError('');
    setResult(null);
    setSaved(false);

    const res = await resolveMapLink(url.trim(), navigation);
    const data = res?.data;
    setChecking(false);

    if (data?.success) {
      setResult(data.data);
      // Google's own label when it had one — the traveller can still rename.
      setName(data.data?.name || '');
    } else {
      setError(data?.message || t('ALERT.WENT_WRONG'));
    }
  };

  const save = async () => {
    if (!result?.inside || !name.trim()) return;
    setSaving(true);
    setError('');

    const res = await addCustomStop(
      {
        trip_id: tripId,
        name: name.trim(),
        latitude: result.latitude,
        longitude: result.longitude,
        kind,
      },
      navigation,
    );
    const data = res?.data;
    setSaving(false);

    if (data?.success) {
      setSaved(true);
    } else {
      setError(data?.message || t('ALERT.WENT_WRONG'));
    }
  };

  return (
    <View style={s.root}>
      <SystemBars style="light" />

      <LinearGradient
        colors={[C.oceanDeep, '#1A3320']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => backPage(navigation)}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <GlobalText text={t('TRIP.ADD_OWN_TITLE')} style={s.headerTitle} />
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <KeyboardSafe>
        <ScrollView
          contentContainerStyle={[s.body, {paddingBottom: insets.bottom + 28}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <GlobalText text={t('TRIP.PASTE_LINK')} style={s.lead} />

          <GlobalText text={t('TRIP.LINK_LABEL')} style={s.label} />
          <TextInput
            style={s.input}
            value={url}
            onChangeText={setUrl}
            placeholder={t('TRIP.LINK_PLACEHOLDER')}
            placeholderTextColor={C.textLight}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={check}
            returnKeyType="go"
          />

          <TouchableOpacity
            style={[s.secondary, (!url.trim() || checking) && s.secondaryOff]}
            onPress={check}
            activeOpacity={0.85}>
            {checking ? (
              <ActivityIndicator size="small" color={C.oceanDeep} />
            ) : (
              <GlobalText text={t('TRIP.LINK_CHECK')} style={s.secondaryTxt} />
            )}
          </TouchableOpacity>

          {!!error && (
            <View style={s.errorBar}>
              <Ionicons name="alert-circle-outline" size={15} color="#B23A2E" />
              <GlobalText text={error} style={s.errorTxt} />
            </View>
          )}

          {!!result && (
            <View style={s.resultCard}>
              <View
                style={[
                  s.badge,
                  result.inside ? s.badgeIn : s.badgeOut,
                ]}>
                <GlobalText
                  style={[s.badgeTxt, result.inside ? s.badgeTxtIn : s.badgeTxtOut]}
                  text={
                    result.inside
                      ? t('TRIP.INSIDE_BADGE')
                      : t('TRIP.OUTSIDE_BADGE')
                  }
                />
              </View>

              <GlobalText
                text={result.name || t('TRIP.PLACE_NAME_LABEL')}
                style={s.resultName}
              />
              <GlobalText
                style={s.resultMeta}
                text={
                  result.inside
                    ? t('TRIP.FOUND_NEAR', {town: result.nearest_town})
                    : t('TRIP.OUTSIDE_DISTANCE', {km: result.distance_km})
                }
              />
              <GlobalText
                style={s.coords}
                text={`${result.latitude}, ${result.longitude}`}
              />
            </View>
          )}

          {/* ── Inside: let them name it, type it, keep it ── */}
          {result?.inside && !saved && (
            <>
              <GlobalText text={t('TRIP.PLACE_NAME_LABEL')} style={s.label} />
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={C.textLight}
                maxLength={120}
              />

              <GlobalText text={t('TRIP.WHAT_KIND')} style={s.label} />
              <View style={s.chips}>
                {KINDS.map(k => (
                  <Chip
                    key={k.code}
                    label={t(`TRIP.${k.key}`)}
                    on={kind === k.code}
                    onPress={() => setKind(kind === k.code ? null : k.code)}
                  />
                ))}
              </View>

              {/* Said before they commit, not after they notice. */}
              <GlobalText text={t('TRIP.OWN_PLACE_NOTE')} style={s.note} />

              <TouchableOpacity
                style={[s.primary, (!name.trim() || saving) && s.primaryOff]}
                onPress={save}
                activeOpacity={0.9}>
                {saving ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <GlobalText text={t('TRIP.ADD_TO_MY_TRIP')} style={s.primaryTxt} />
                )}
              </TouchableOpacity>
            </>
          )}

          {saved && (
            <View style={s.savedBar}>
              <Ionicons name="checkmark-circle" size={17} color={C.forestMid} />
              <GlobalText text={t('TRIP.LINK_ADDED')} style={s.savedTxt} />
            </View>
          )}

          {/* ── Outside: refuse, say why, and offer somewhere real ── */}
          {result && !result.inside && (
            <>
              <GlobalText text={t('TRIP.OUTSIDE_BODY')} style={s.note} />

              {(result.nearby || []).length > 0 && (
                <>
                  <GlobalText
                    text={t('TRIP.NEAREST_COVERED')}
                    style={s.sectionLabel}
                  />
                  {result.nearby.map(p => (
                    <View key={p.id} style={s.nearbyRow}>
                      <Ionicons name="location-outline" size={16} color={C.oceanMid} />
                      <View style={{flex: 1}}>
                        <GlobalText text={p.name} style={s.nearbyName} />
                        <GlobalText
                          text={t('TRIP.FROM_YOUR_PIN', {km: p.distance_km})}
                          style={s.nearbyMeta}
                        />
                      </View>
                    </View>
                  ))}
                </>
              )}

              <TouchableOpacity
                style={s.secondary}
                onPress={() => backPage(navigation)}
                activeOpacity={0.85}>
                <GlobalText text={t('TRIP.BACK_TO_MAP')} style={s.secondaryTxt} />
              </TouchableOpacity>
            </>
          )}

          {!result && (
            <View style={s.howCard}>
              <GlobalText text={t('TRIP.HOW_TO_LINK')} style={s.sectionLabel} />
              <GlobalText text={t('TRIP.HOW_TO_LINK_BODY')} style={s.howBody} />
            </View>
          )}
        </ScrollView>
      </KeyboardSafe>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  header: {paddingHorizontal: 20, paddingBottom: 40, position: 'relative', overflow: 'hidden'},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {flex: 1, fontSize: 18, fontWeight: '700', color: C.white},
  headerCurve: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 22,
    backgroundColor: C.cream,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  body: {paddingHorizontal: 18, paddingTop: 16},
  lead: {fontSize: 15, fontWeight: '700', color: C.textDark, marginBottom: 14},
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 7,
  },
  input: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: C.textDark,
  },

  secondary: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(13,61,74,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  secondaryOff: {opacity: 0.45},
  secondaryTxt: {fontSize: 14.5, fontWeight: '700', color: C.oceanDeep},

  primary: {
    height: 50,
    borderRadius: 14,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryOff: {opacity: 0.45},
  primaryTxt: {fontSize: 15, fontWeight: '700', color: C.white},

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(178,58,46,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(178,58,46,0.22)',
    marginTop: 14,
  },
  errorTxt: {flex: 1, fontSize: 12.5, color: '#B23A2E'},

  resultCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 14,
    marginTop: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeIn: {backgroundColor: 'rgba(46,92,58,0.12)'},
  badgeOut: {backgroundColor: 'rgba(178,58,46,0.10)'},
  badgeTxt: {fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6},
  badgeTxtIn: {color: C.forestMid},
  badgeTxtOut: {color: '#B23A2E'},
  resultName: {fontSize: 17, fontWeight: '700', color: C.textDark},
  resultMeta: {fontSize: 12.5, color: C.textMid, marginTop: 3},
  coords: {fontSize: 11.5, color: C.textLight, marginTop: 5},

  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: C.white,
  },
  chipOn: {borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.08)'},
  chipTxt: {fontSize: 13, fontWeight: '600', color: C.textMid},
  chipTxtOn: {color: C.oceanDeep},

  note: {fontSize: 12.5, color: C.textMid, lineHeight: 19, marginTop: 16},
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 18,
    marginBottom: 8,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
    padding: 12,
    marginBottom: 8,
  },
  nearbyName: {fontSize: 14, fontWeight: '700', color: C.textDark},
  nearbyMeta: {fontSize: 11.5, color: C.textLight, marginTop: 2},

  savedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(46,92,58,0.10)',
    marginTop: 18,
  },
  savedTxt: {fontSize: 13.5, fontWeight: '700', color: C.forestMid},

  howCard: {
    backgroundColor: 'rgba(0,0,0,0.025)',
    borderRadius: 12,
    padding: 14,
    marginTop: 22,
  },
  howBody: {fontSize: 12.5, color: C.textMid, lineHeight: 19},
});

export default AddFromLinkScreen;
