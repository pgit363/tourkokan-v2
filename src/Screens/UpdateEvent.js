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
  Modal,
  Image,
  BackHandler,
} from 'react-native';
import {useAppDialog} from '../Components/Common/AppDialog';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {FTP_PATH} from '@env';
import {backPage} from '../Services/CommonMethods';
import {comnPost, comnPostForm} from '../Services/Api/CommonServices';
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
  amber: '#D97706',
};

const TALUKAS = ['Devgad','Kudal','Malvan','Sawantwadi','Vengurla','Dodamarg','Kankavli','Vaibhavvadi'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK_DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const BLOCKED_STATUSES = ['cancelled', 'completed'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toApiDate = d => d ? `${d.year}-${String(d.month + 1).padStart(2,'0')}-${String(d.day).padStart(2,'0')}` : '';
const toDisplay = d => d ? `${d.day} ${MONTHS[d.month]} ${d.year}` : null;
const todayObj = () => { const n = new Date(); return {year: n.getFullYear(), month: n.getMonth(), day: n.getDate()}; };
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const firstDay = (y, m) => new Date(y, m, 1).getDay();

const parseApiDate = str => {
  if (!str) return null;
  const [year, month, day] = str.split('T')[0].split(' ')[0].split('-').map(Number);
  if (!year || !month || !day || isNaN(day)) return null;
  return {year, month: month - 1, day};
};

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

const Field = ({label, required, children}) => (
  <View style={s.field}>
    <Text style={s.label}>{label}{required && <Text style={s.required}> *</Text>}</Text>
    {children}
  </View>
);

// ─── UpdateEvent ──────────────────────────────────────────────────────────────

const UpdateEvent = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const {show: showDialog, dialog} = useAppDialog();
  const event = route?.params?.event ?? {};
  const isBlocked = BLOCKED_STATUSES.includes(event.status);

  const existingBannerUri = event.banner_image_url
    || (event.banner_image ? `${FTP_PATH}${event.banner_image}` : null);

  const [title, setTitle] = useState(event.title ?? '');
  const [description, setDescription] = useState(event.description ?? '');
  const [address, setAddress] = useState(event.address ?? '');
  const [venueName, setVenueName] = useState(event.venue_name ?? '');
  const [taluka, setTaluka] = useState(event.taluka ?? '');
  const [startDate, setStartDate] = useState(parseApiDate(event.start_date));
  const [endDate, setEndDate] = useState(parseApiDate(event.end_date));
  const [isFree, setIsFree] = useState(event.is_free !== false);
  const [entryFee, setEntryFee] = useState(event.entry_fee ? String(event.entry_fee) : '');
  const [videoUrl, setVideoUrl] = useState(event.video_url ?? '');
  const [newBanner, setNewBanner] = useState(null);

  const hasUnsavedChanges = !isBlocked && (
    title !== (event.title ?? '') ||
    description !== (event.description ?? '') ||
    address !== (event.address ?? '') ||
    venueName !== (event.venue_name ?? '') ||
    taluka !== (event.taluka ?? '') ||
    toApiDate(startDate) !== (event.start_date?.split('T')[0] ?? '') ||
    toApiDate(endDate) !== (event.end_date?.split('T')[0] ?? '') ||
    isFree !== (event.is_free !== false) ||
    entryFee !== (event.entry_fee ? String(event.entry_fee) : '') ||
    videoUrl !== (event.video_url ?? '') ||
    !!newBanner
  );

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      showDialog({
        type: 'confirm',
        title: 'Discard Changes?',
        message: 'You have unsaved changes. Are you sure you want to go back?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        onConfirm: () => navigation.goBack(),
      });
    } else {
      navigation.goBack();
    }
  }, [hasUnsavedChanges, navigation, showDialog]);

  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => handler.remove();
    }, [handleBack]),
  );
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activePicker, setActivePicker] = useState(null);
  const [showTaluka, setShowTaluka] = useState(false);

  const pickBanner = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.85, selectionLimit: 1}, response => {
      if (!response.didCancel && response.assets?.[0]) {
        setNewBanner(response.assets[0]);
      }
    });
  };

  const validate = () => {
    if (!title.trim()) { showDialog({type:'warning', title:'Required', message:t('UPDATE_EVENT.TITLE_REQUIRED')}); return false; }
    if (!description.trim()) { showDialog({type:'warning', title:'Required', message:t('UPDATE_EVENT.DESC_REQUIRED')}); return false; }
    if (!address.trim()) { showDialog({type:'warning', title:'Required', message:t('UPDATE_EVENT.ADDRESS_REQUIRED')}); return false; }
    if (!taluka) { showDialog({type:'warning', title:'Required', message:t('UPDATE_EVENT.TALUKA_REQUIRED')}); return false; }
    if (!startDate) { showDialog({type:'warning', title:'Required', message:t('UPDATE_EVENT.START_DATE_REQUIRED')}); return false; }
    if (!endDate) { showDialog({type:'warning', title:'Required', message:t('UPDATE_EVENT.END_DATE_REQUIRED')}); return false; }
    if (!isFree && !entryFee.trim()) { showDialog({type:'warning', title:'Required', message:t('UPDATE_EVENT.ENTRY_FEE_REQUIRED')}); return false; }
    return true;
  };

  const confirmDelete = () => {
    showDialog({
      type: 'delete',
      title: t('MY_SUBMISSIONS.DELETE_TITLE'),
      message: t('MY_SUBMISSIONS.DELETE_EVENT_MSG'),
      confirmText: t('MY_SUBMISSIONS.DELETE_BTN'),
      cancelText: t('BUTTON.CANCEL'),
      onConfirm: async () => {
        setDeleting(true);
        const res = await comnPost('v2/deleteEvent', {id: event.id}, navigation).catch(() => null);
        setDeleting(false);
        if (res?.data?.success) {
          navigation.replace(STRING.SCREEN.MY_EVENTS);
        } else {
          showDialog({type: 'error', title: t('ALERT.FAILED'), message: t('MY_SUBMISSIONS.DELETE_ERROR')});
        }
      },
    });
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const fd = new FormData();
    fd.append('id', event.id);
    fd.append('title', title.trim());
    fd.append('description', description.trim());
    fd.append('address', address.trim());
    fd.append('taluka', taluka);
    fd.append('start_date', toApiDate(startDate));
    fd.append('end_date', toApiDate(endDate));
    fd.append('is_free', isFree ? '1' : '0');
    if (venueName.trim()) fd.append('venue_name', venueName.trim());
    if (!isFree && entryFee.trim()) fd.append('entry_fee', entryFee.trim());
    if (videoUrl.trim()) fd.append('video_url', videoUrl.trim());

    // Pass through fields the API expects but we don't have UI for yet
    if (event.start_time) fd.append('start_time', event.start_time);
    if (event.end_time) fd.append('end_time', event.end_time);
    if (event.organizer_name) fd.append('organizer_name', event.organizer_name);
    if (event.organizer_phone) fd.append('organizer_phone', String(event.organizer_phone));
    if (event.organizer_email) fd.append('organizer_email', event.organizer_email);
    if (event.registration_required != null) fd.append('registration_required', event.registration_required ? '1' : '0');
    if (event.max_participants) fd.append('max_participants', String(event.max_participants));
    if (Array.isArray(event.tags)) event.tags.forEach(tag => fd.append('tags[]', typeof tag === 'object' ? tag.name : tag));

    if (newBanner) {
      fd.append('banner_image', {
        uri: newBanner.uri,
        type: newBanner.type || 'image/jpeg',
        name: newBanner.fileName || 'banner.jpg',
      });
    }

    const res = await comnPostForm('v2/updateEvent', fd);
    setSubmitting(false);

    // comnPostForm returns Axios error object on failure (not null), so check both paths
    const resData = res?.data ?? res?.response?.data;
    if (resData?.success) {
      showDialog({
        type: 'success',
        title: t('UPDATE_EVENT.UPDATED'),
        message: resData?.message || t('UPDATE_EVENT.UPDATED_MSG'),
        confirmText: t('UPDATE_EVENT.MY_EVENTS_BTN'),
        onConfirm: () => navigation.replace(STRING.SCREEN.MY_EVENTS),
        onClose: () => navigation.replace(STRING.SCREEN.MY_EVENTS),
      });
    } else {
      const msg = resData?.message;
      const displayMsg = typeof msg === 'string'
        ? msg
        : typeof msg === 'object' && msg !== null
          ? Object.values(msg).flat().join('\n')
          : t('ALERT.WENT_WRONG');
      showDialog({type: 'error', title: t('ALERT.FAILED'), message: displayMsg});
    }
  };

  const currentBannerUri = newBanner ? newBanner.uri : existingBannerUri;

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('UPDATE_EVENT.TITLE')}</Text>
        </View>
        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* Blocked notice */}
      {isBlocked && (
        <View style={s.blockedBanner}>
          <Ionicons name="lock-closed-outline" size={15} color={C.amber} />
          <Text style={s.blockedText}>{t('UPDATE_EVENT.BLOCKED')}</Text>
        </View>
      )}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, {paddingBottom: insets.bottom + 100}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isBlocked}>

        {/* Banner */}
        <Field label="Banner Image">
          <TouchableOpacity
            style={s.bannerPicker}
            onPress={isBlocked ? undefined : pickBanner}
            activeOpacity={isBlocked ? 1 : 0.8}>
            {currentBannerUri ? (
              <>
                <Image source={{uri: currentBannerUri}} style={s.bannerPreview} />
                {!isBlocked && (
                  <View style={s.bannerOverlay}>
                    <Ionicons name="camera-outline" size={20} color={C.white} />
                    <Text style={s.bannerOverlayText}>
                      {newBanner ? 'Change' : 'Replace Banner'}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={s.bannerPlaceholder}>
                <Ionicons name="image-outline" size={28} color={C.textLight} />
                <Text style={s.bannerPlaceholderText}>
                  {isBlocked ? 'No banner' : 'Tap to add banner image'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {newBanner && (
            <TouchableOpacity style={s.clearBanner} onPress={() => setNewBanner(null)}>
              <Ionicons name="refresh-outline" size={14} color={C.oceanMid} />
              <Text style={s.clearBannerText}>Revert to original</Text>
            </TouchableOpacity>
          )}
        </Field>

        <Field label="Event Title" required>
          <TextInput style={[s.input, isBlocked && s.inputDisabled]} value={title} onChangeText={setTitle}
            placeholder="e.g. Malvan Seafood Festival" placeholderTextColor={C.textLight}
            maxLength={255} editable={!isBlocked} />
        </Field>

        <Field label="Description" required>
          <TextInput style={[s.input, s.textArea, isBlocked && s.inputDisabled]} value={description}
            onChangeText={setDescription} placeholder="Describe your event…"
            placeholderTextColor={C.textLight} multiline maxLength={5000}
            textAlignVertical="top" editable={!isBlocked} />
        </Field>

        <Field label="Address" required>
          <TextInput style={[s.input, isBlocked && s.inputDisabled]} value={address}
            onChangeText={setAddress} placeholder="e.g. Near Sindhudurg Fort, Malvan"
            placeholderTextColor={C.textLight} editable={!isBlocked} />
        </Field>

        <Field label="Venue Name">
          <TextInput style={[s.input, isBlocked && s.inputDisabled]} value={venueName}
            onChangeText={setVenueName} placeholder="e.g. Malvan Beach Ground"
            placeholderTextColor={C.textLight} maxLength={255} editable={!isBlocked} />
        </Field>

        <Field label="Taluka" required>
          <TouchableOpacity
            style={[s.selectPill, isBlocked && s.inputDisabled]}
            onPress={isBlocked ? undefined : () => setShowTaluka(true)}
            activeOpacity={isBlocked ? 1 : 0.75}>
            <Ionicons name="location-outline" size={15} color={taluka ? C.oceanMid : C.textLight} />
            <Text style={[s.selectPillText, !taluka && s.selectPillPlaceholder]}>
              {taluka || 'Select taluka'}
            </Text>
            {!isBlocked && <Ionicons name="chevron-down" size={14} color={C.textLight} />}
          </TouchableOpacity>
        </Field>

        {/* Dates */}
        <View style={s.dateRow}>
          <View style={[s.field, {flex: 1}]}>
            <Text style={s.label}>Start Date<Text style={s.required}> *</Text></Text>
            <TouchableOpacity
              style={[s.datePill, isBlocked && s.inputDisabled]}
              onPress={isBlocked ? undefined : () => setActivePicker('start')}
              activeOpacity={isBlocked ? 1 : 0.75}>
              <Ionicons name="calendar-outline" size={15} color={startDate ? C.oceanMid : C.textLight} />
              <Text style={[s.datePillText, !startDate && s.datePillPlaceholder]}>
                {startDate ? toDisplay(startDate) : 'Pick date'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[s.field, {flex: 1}]}>
            <Text style={s.label}>End Date<Text style={s.required}> *</Text></Text>
            <TouchableOpacity
              style={[s.datePill, isBlocked && s.inputDisabled]}
              onPress={isBlocked ? undefined : () => setActivePicker('end')}
              activeOpacity={isBlocked ? 1 : 0.75}>
              <Ionicons name="calendar-outline" size={15} color={endDate ? C.oceanMid : C.textLight} />
              <Text style={[s.datePillText, !endDate && s.datePillPlaceholder]}>
                {endDate ? toDisplay(endDate) : 'Pick date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Entry */}
        <Field label="Entry">
          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.toggleBtn, isFree && s.toggleBtnActive, isBlocked && s.inputDisabled]}
              onPress={isBlocked ? undefined : () => setIsFree(true)} activeOpacity={isBlocked ? 1 : 0.8}>
              <Text style={[s.toggleText, isFree && s.toggleTextActive]}>Free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, !isFree && s.toggleBtnActive, isBlocked && s.inputDisabled]}
              onPress={isBlocked ? undefined : () => setIsFree(false)} activeOpacity={isBlocked ? 1 : 0.8}>
              <Text style={[s.toggleText, !isFree && s.toggleTextActive]}>Paid</Text>
            </TouchableOpacity>
          </View>
          {!isFree && (
            <TextInput
              style={[s.input, {marginTop: 10}, isBlocked && s.inputDisabled]}
              value={entryFee} onChangeText={setEntryFee}
              placeholder="Entry fee (₹)" placeholderTextColor={C.textLight}
              keyboardType="numeric" editable={!isBlocked}
            />
          )}
        </Field>

        {/* Video URL */}
        <Field label="Video URL">
          <TextInput
            style={[s.input, isBlocked && s.inputDisabled]}
            value={videoUrl} onChangeText={setVideoUrl}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor={C.textLight}
            autoCapitalize="none" keyboardType="url"
            editable={!isBlocked}
          />
        </Field>

      </ScrollView>

      <View style={[s.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        {!isBlocked && (
          <TouchableOpacity
            style={[s.submitBtn, submitting && {opacity: 0.7}]}
            onPress={submit} disabled={submitting || deleting} activeOpacity={0.85}>
            {submitting ? (
              <ActivityIndicator size="small" color={C.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={C.white} />
                <Text style={s.submitBtnText}>{t('UPDATE_EVENT.SAVE_BTN')}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.deleteBtn, (deleting || submitting) && {opacity: 0.6}]}
          onPress={confirmDelete} disabled={deleting || submitting} activeOpacity={0.85}>
          {deleting ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
              <Text style={s.deleteBtnText}>{t('MY_SUBMISSIONS.DELETE_BTN')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CalendarPicker
        visible={activePicker === 'start'}
        title="Start Date" value={startDate}
        onConfirm={d => { setStartDate(d); setActivePicker(null); }}
        onClose={() => setActivePicker(null)}
      />
      <CalendarPicker
        visible={activePicker === 'end'}
        title="End Date" value={endDate}
        minValue={startDate ?? undefined}
        onConfirm={d => { setEndDate(d); setActivePicker(null); }}
        onClose={() => setActivePicker(null)}
      />
      <TalukaDropdown
        visible={showTaluka}
        onSelect={t => { setTaluka(t); setShowTaluka(false); }}
        onClose={() => setShowTaluka(false)}
      />
      {dialog}
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
  blockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  blockedText: {flex: 1, fontSize: 13, color: C.amber, fontWeight: '500'},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 16},
  field: {marginBottom: 16},
  label: {fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 6},
  required: {color: C.error},
  inputDisabled: {opacity: 0.55, backgroundColor: '#F3F4F6'},

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
  clearBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 6, alignSelf: 'flex-start',
  },
  clearBannerText: {fontSize: 12, color: C.oceanMid, fontWeight: '600'},

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
    marginBottom: 10,
  },
  submitBtnText: {fontSize: 16, fontWeight: '700', color: C.white},
  deleteBtn: {
    borderWidth: 1.5, borderColor: '#FCA5A5', borderRadius: 14, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  deleteBtnText: {fontSize: 15, fontWeight: '600', color: '#DC2626'},
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

export default UpdateEvent;
