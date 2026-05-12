import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  Image,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {backPage} from '../Services/CommonMethods';
import {comnPostForm} from '../Services/Api/CommonServices';
import STRING from '../Services/Constants/STRINGS';

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestDeep: '#1A3320',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
  error: '#DC2626',
};

const TALUKAS = ['Devgad','Kudal','Malvan','Sawantwadi','Vengurla','Dodamarg','Kankavli','Vaibhavvadi'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK_DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toApiDate = d => d ? `${d.year}-${String(d.month + 1).padStart(2,'0')}-${String(d.day).padStart(2,'0')}` : '';
const toDisplay = d => d ? `${d.day} ${MONTHS[d.month]} ${d.year}` : null;
const todayObj = () => { const n = new Date(); return {year: n.getFullYear(), month: n.getMonth(), day: n.getDate()}; };
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay = (y, m) => new Date(y, m, 1).getDay();

// ─── Calendar picker ──────────────────────────────────────────────────────────

const CalendarPicker = ({visible, title, value, minValue, onConfirm, onClose}) => {
  const init = value ?? todayObj();
  const [year, setYear] = useState(init.year);
  const [month, setMonth] = useState(init.month);
  const [day, setDay] = useState(init.day);

  const totalDays = daysInMonth(year, month);
  const fDay = firstDay(year, month);

  const isDisabled = d => {
    if (!minValue) return false;
    if (year !== minValue.year) return year < minValue.year;
    if (month !== minValue.month) return month < minValue.month;
    return d < minValue.day;
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setDay(1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setDay(1); };

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < fDay; i++) arr.push(null);
    for (let d = 1; d <= totalDays; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [fDay, totalDays]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={cp.overlay} activeOpacity={1} onPress={onClose} />
      <View style={cp.sheet}>
        <View style={cp.header}>
          <TouchableOpacity onPress={onClose}><Text style={cp.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={cp.title}>{title}</Text>
          <TouchableOpacity onPress={() => onConfirm({year, month, day: Math.min(day, totalDays)})}>
            <Text style={cp.done}>Done</Text>
          </TouchableOpacity>
        </View>
        <View style={cp.nav}>
          <TouchableOpacity style={cp.navBtn} onPress={prevMonth} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name="chevron-back" size={20} color={C.oceanMid} />
          </TouchableOpacity>
          <Text style={cp.navLabel}>{MONTH_FULL[month]} {year}</Text>
          <TouchableOpacity style={cp.navBtn} onPress={nextMonth} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <Ionicons name="chevron-forward" size={20} color={C.oceanMid} />
          </TouchableOpacity>
        </View>
        <View style={cp.weekRow}>{WEEK_DAYS.map(d => <Text key={d} style={cp.weekDay}>{d}</Text>)}</View>
        <View style={cp.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={`e-${i}`} style={cp.cell} />;
            const disabled = isDisabled(d);
            const selected = d === day;
            return (
              <TouchableOpacity
                key={d} style={[cp.cell, selected && cp.cellSelected, disabled && cp.cellDisabled]}
                onPress={() => !disabled && setDay(d)} activeOpacity={disabled ? 1 : 0.7}>
                <Text style={[cp.cellText, selected && cp.cellTextSelected, disabled && cp.cellTextDisabled]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

// ─── Taluka dropdown ──────────────────────────────────────────────────────────

const TalukaDropdown = ({visible, onSelect, onClose}) => (
  <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
    <TouchableOpacity style={cp.overlay} activeOpacity={1} onPress={onClose} />
    <View style={cp.sheet}>
      <View style={cp.header}>
        <View style={{width: 60}} />
        <Text style={cp.title}>Select Taluka</Text>
        <TouchableOpacity onPress={onClose}><Text style={cp.cancel}>Close</Text></TouchableOpacity>
      </View>
      <ScrollView>
        {TALUKAS.map(t => (
          <TouchableOpacity key={t} style={td.item} onPress={() => onSelect(t)} activeOpacity={0.7}>
            <Text style={td.itemText}>{t}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.textLight} />
          </TouchableOpacity>
        ))}
        <View style={{height: 24}} />
      </ScrollView>
    </View>
  </Modal>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({label, required, children}) => (
  <View style={s.field}>
    <Text style={s.label}>{label}{required && <Text style={s.required}> *</Text>}</Text>
    {children}
  </View>
);

// ─── CreateEvent ──────────────────────────────────────────────────────────────

const CreateEvent = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const prefilledSiteId = route?.params?.site_id ?? null;

  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        navigation.goBack();
        return true;
      });
      return () => handler.remove();
    }, [navigation]),
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [venueName, setVenueName] = useState('');
  const [taluka, setTaluka] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [siteId] = useState(prefilledSiteId);
  const [isFree, setIsFree] = useState(true);
  const [entryFee, setEntryFee] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [bannerImage, setBannerImage] = useState(null); // {uri, type, fileName}
  const [submitting, setSubmitting] = useState(false);

  const [activePicker, setActivePicker] = useState(null);
  const [showTaluka, setShowTaluka] = useState(false);

  const pickBanner = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.85, selectionLimit: 1}, response => {
      if (!response.didCancel && response.assets?.[0]) {
        setBannerImage(response.assets[0]);
      }
    });
  };

  const validate = () => {
    if (!title.trim()) { Alert.alert('Required', 'Event title is required.'); return false; }
    if (!description.trim()) { Alert.alert('Required', 'Description is required.'); return false; }
    if (!address.trim()) { Alert.alert('Required', 'Address is required.'); return false; }
    if (!taluka) { Alert.alert('Required', 'Please select a taluka.'); return false; }
    if (!startDate) { Alert.alert('Required', 'Please select a start date.'); return false; }
    if (!endDate) { Alert.alert('Required', 'Please select an end date.'); return false; }
    if (!isFree && !entryFee.trim()) { Alert.alert('Required', 'Entry fee is required for paid events.'); return false; }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('address', address.trim());
    fd.append('taluka', taluka);
    fd.append('start_date', toApiDate(startDate));
    fd.append('end_date', toApiDate(endDate));
    fd.append('is_free', isFree ? '1' : '0');
    if (venueName.trim()) fd.append('venue_name', venueName.trim());
    if (siteId) fd.append('site_id', String(siteId));
    if (!isFree && entryFee.trim()) fd.append('entry_fee', entryFee.trim());
    if (videoUrl.trim()) fd.append('video_url', videoUrl.trim());
    if (bannerImage) {
      fd.append('banner_image', {
        uri: bannerImage.uri,
        type: bannerImage.type || 'image/jpeg',
        name: bannerImage.fileName || 'banner.jpg',
      });
    }

    console.log('[CreateEvent] POST v2/createEvent (FormData)');
    const res = await comnPostForm('v2/createEvent', fd).catch(err => {
      console.log('[CreateEvent] ERROR', err);
      return null;
    });
    console.log('[CreateEvent] RESPONSE', res?.data);
    setSubmitting(false);

    if (res?.data?.success) {
      Alert.alert('Submitted!', 'Your event has been submitted for admin approval.', [
        {text: 'My Events', onPress: () => navigation.navigate(STRING.SCREEN.MY_EVENTS)},
        {text: 'Done', onPress: () => backPage(navigation)},
      ]);
    } else {
      const msg = res?.data?.message;
      const displayMsg = typeof msg === 'string'
        ? msg
        : typeof msg === 'object' && msg !== null
          ? Object.values(msg).flat().join('\n')
          : 'Could not submit event. Please try again.';
      Alert.alert('Error', displayMsg);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => backPage(navigation)} activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Create Event</Text>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, {paddingBottom: insets.bottom + 100}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Banner image picker */}
        <Field label="Banner Image">
          <TouchableOpacity style={s.bannerPicker} onPress={pickBanner} activeOpacity={0.8}>
            {bannerImage ? (
              <>
                <Image source={{uri: bannerImage.uri}} style={s.bannerPreview} />
                <View style={s.bannerOverlay}>
                  <Ionicons name="camera-outline" size={20} color={C.white} />
                  <Text style={s.bannerOverlayText}>Change</Text>
                </View>
              </>
            ) : (
              <View style={s.bannerPlaceholder}>
                <Ionicons name="image-outline" size={28} color={C.textLight} />
                <Text style={s.bannerPlaceholderText}>Tap to add banner image</Text>
              </View>
            )}
          </TouchableOpacity>
        </Field>

        <Field label="Event Title" required>
          <TextInput style={s.input} value={title} onChangeText={setTitle}
            placeholder="e.g. Malvan Seafood Festival" placeholderTextColor={C.textLight} maxLength={255} />
        </Field>

        <Field label="Description" required>
          <TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription}
            placeholder="Describe your event…" placeholderTextColor={C.textLight}
            multiline maxLength={5000} textAlignVertical="top" />
        </Field>

        <Field label="Address" required>
          <TextInput style={s.input} value={address} onChangeText={setAddress}
            placeholder="e.g. Near Sindhudurg Fort, Malvan" placeholderTextColor={C.textLight} />
        </Field>

        <Field label="Venue Name">
          <TextInput style={s.input} value={venueName} onChangeText={setVenueName}
            placeholder="e.g. Malvan Beach Ground" placeholderTextColor={C.textLight} maxLength={255} />
        </Field>

        <Field label="Taluka" required>
          <TouchableOpacity style={s.selectPill} onPress={() => setShowTaluka(true)} activeOpacity={0.75}>
            <Ionicons name="location-outline" size={15} color={taluka ? C.oceanMid : C.textLight} />
            <Text style={[s.selectPillText, !taluka && s.selectPillPlaceholder]}>
              {taluka || 'Select taluka'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={C.textLight} />
          </TouchableOpacity>
        </Field>

        {/* Dates */}
        <View style={s.dateRow}>
          <View style={[s.field, {flex: 1}]}>
            <Text style={s.label}>Start Date<Text style={s.required}> *</Text></Text>
            <TouchableOpacity style={s.datePill} onPress={() => setActivePicker('start')} activeOpacity={0.75}>
              <Ionicons name="calendar-outline" size={15} color={startDate ? C.oceanMid : C.textLight} />
              <Text style={[s.datePillText, !startDate && s.datePillPlaceholder]}>
                {startDate ? toDisplay(startDate) : 'Pick date'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[s.field, {flex: 1}]}>
            <Text style={s.label}>End Date<Text style={s.required}> *</Text></Text>
            <TouchableOpacity style={s.datePill} onPress={() => setActivePicker('end')} activeOpacity={0.75}>
              <Ionicons name="calendar-outline" size={15} color={endDate ? C.oceanMid : C.textLight} />
              <Text style={[s.datePillText, !endDate && s.datePillPlaceholder]}>
                {endDate ? toDisplay(endDate) : 'Pick date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Free / Paid toggle */}
        <Field label="Entry">
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, isFree && s.toggleBtnActive]}
              onPress={() => setIsFree(true)} activeOpacity={0.8}>
              <Text style={[s.toggleText, isFree && s.toggleTextActive]}>Free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, !isFree && s.toggleBtnActive]}
              onPress={() => setIsFree(false)} activeOpacity={0.8}>
              <Text style={[s.toggleText, !isFree && s.toggleTextActive]}>Paid</Text>
            </TouchableOpacity>
          </View>
          {!isFree && (
            <TextInput
              style={[s.input, {marginTop: 10}]}
              value={entryFee}
              onChangeText={setEntryFee}
              placeholder="Entry fee (₹)"
              placeholderTextColor={C.textLight}
              keyboardType="numeric"
            />
          )}
        </Field>

        {/* Video URL */}
        <Field label="Video URL">
          <TextInput
            style={s.input}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor={C.textLight}
            autoCapitalize="none"
            keyboardType="url"
          />
        </Field>

      </ScrollView>

      <View style={[s.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <TouchableOpacity
          style={[s.submitBtn, submitting && {opacity: 0.7}]}
          onPress={submit} disabled={submitting} activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={18} color={C.white} />
              <Text style={s.submitBtnText}>Submit Event</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CalendarPicker
        visible={activePicker === 'start'}
        title="Start Date"
        value={startDate}
        onConfirm={d => { setStartDate(d); setActivePicker(null); }}
        onClose={() => setActivePicker(null)}
      />
      <CalendarPicker
        visible={activePicker === 'end'}
        title="End Date"
        value={endDate}
        minValue={startDate ?? undefined}
        onConfirm={d => { setEndDate(d); setActivePicker(null); }}
        onClose={() => setActivePicker(null)}
      />
      <TalukaDropdown
        visible={showTaluka}
        onSelect={t => { setTaluka(t); setShowTaluka(false); }}
        onClose={() => setShowTaluka(false)}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  header: {paddingHorizontal: 20, paddingBottom: 48, position: 'relative', overflow: 'hidden'},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {flex: 1, fontSize: 20, fontWeight: '700', color: C.white, letterSpacing: 0.2},
  headerCurve: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
    backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 16},
  field: {marginBottom: 16},
  label: {fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 6},
  required: {color: C.error},

  // Banner picker
  bannerPicker: {
    height: 160, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
  },
  bannerPreview: {width: '100%', height: '100%', resizeMode: 'cover'},
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  bannerOverlayText: {fontSize: 13, fontWeight: '600', color: C.white},
  bannerPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.white,
  },
  bannerPlaceholderText: {fontSize: 13, color: C.textLight},

  input: {
    backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.textDark,
  },
  textArea: {minHeight: 100, paddingTop: 13},
  dateRow: {flexDirection: 'row', gap: 12},
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.white,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  datePillText: {flex: 1, fontSize: 13, color: C.textDark, fontWeight: '500'},
  datePillPlaceholder: {color: C.textLight, fontWeight: '400'},
  selectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.white,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  selectPillText: {flex: 1, fontSize: 14, color: C.textDark, fontWeight: '500'},
  selectPillPlaceholder: {color: C.textLight, fontWeight: '400'},
  toggleRow: {flexDirection: 'row', gap: 10},
  toggleBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    backgroundColor: C.white, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  toggleBtnActive: {backgroundColor: C.oceanMid, borderColor: C.oceanMid},
  toggleText: {fontSize: 14, fontWeight: '600', color: C.textMid},
  toggleTextActive: {color: C.white},
  footer: {
    paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)',
  },
  submitBtn: {
    backgroundColor: C.oceanMid, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnText: {fontSize: 16, fontWeight: '700', color: C.white},
});

const CELL_SIZE = 42;
const cp = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  title: {fontSize: 15, fontWeight: '700', color: C.textDark},
  cancel: {fontSize: 15, color: C.textLight},
  done: {fontSize: 15, fontWeight: '700', color: C.oceanMid},
  nav: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14},
  navBtn: {width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(27,107,123,0.1)', alignItems: 'center', justifyContent: 'center'},
  navLabel: {fontSize: 16, fontWeight: '700', color: C.textDark},
  weekRow: {flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4},
  weekDay: {width: CELL_SIZE, textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.textLight},
  grid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12},
  cell: {width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center', borderRadius: CELL_SIZE / 2},
  cellSelected: {backgroundColor: C.oceanMid},
  cellDisabled: {opacity: 0.3},
  cellText: {fontSize: 14, color: C.textDark, fontWeight: '500'},
  cellTextSelected: {color: C.white, fontWeight: '700'},
  cellTextDisabled: {color: C.textLight},
});

const td = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  itemText: {fontSize: 15, color: C.textDark, fontWeight: '500'},
});

export default CreateEvent;
