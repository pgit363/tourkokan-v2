import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {launchImageLibrary} from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {backPage} from '../Services/CommonMethods';
import {comnPost, comnPostForm} from '../Services/Api/CommonServices';
import STRING from '../Services/Constants/STRINGS';

const {width: SW} = Dimensions.get('window');

const C = {
  oceanDeep: '#0D3D4A',
  oceanMid: '#1B6B7B',
  forestDeep: '#1A3320',
  oceanFoam: '#B8E4EA',
  cream: '#FAF7F0',
  white: '#FFFFFF',
  textDark: '#1C1917',
  textMid: '#44403C',
  textLight: '#78716C',
};

const STEPS = ['Basic Info', 'Location', 'Photos', 'Details'];

const SubmitPlaceScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const editData = route?.params?.editSubmission ?? null;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  // Step 1
  const [name, setName] = useState(editData?.name ?? '');
  const [description, setDescription] = useState(editData?.description ?? '');
  const [tagLine, setTagLine] = useState(editData?.tag_line ?? '');
  const [selectedCategories, setSelectedCategories] = useState(
    editData?.categories?.map(c => c.id) ?? [],
  );

  // Step 2
  const [latitude, setLatitude] = useState(editData?.latitude ? String(editData.latitude) : '');
  const [longitude, setLongitude] = useState(editData?.longitude ? String(editData.longitude) : '');
  const [mapsUrl, setMapsUrl] = useState('');
  const [parsingUrl, setParsingUrl] = useState(false);

  // Step 3
  const [image, setImage] = useState(null);
  const [logo, setLogo] = useState(null);

  // Step 4
  const [website, setWebsite] = useState(editData?.domain_name ?? '');
  const [pinCode, setPinCode] = useState(editData?.pin_code ?? '');

  const isEdit = !!editData;

  useEffect(() => {
    comnPost('v2/listcategories', {per_page: 100})
      .then(res => setCategories(res?.data?.data?.data || []))
      .catch(() => {});
  }, []);

  const parseMapUrl = async () => {
    if (!mapsUrl.trim()) return;
    setParsingUrl(true);
    const res = await comnPost('v2/parseMapUrl', {url: mapsUrl.trim()}).catch(() => null);
    setParsingUrl(false);
    if (res?.data?.success) {
      setLatitude(String(res.data.data.latitude));
      setLongitude(String(res.data.data.longitude));
      setMapsUrl('');
      Alert.alert('Success', 'Coordinates extracted successfully.');
    } else {
      Alert.alert(
        'Could Not Parse',
        res?.data?.message ||
          'Could not extract coordinates from this URL. Please enter manually.',
      );
    }
  };

  const pickImage = async field => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.8});
    if (!result.didCancel && result.assets?.[0]) {
      if (field === 'image') setImage(result.assets[0]);
      else setLogo(result.assets[0]);
    }
  };

  const toggleCategory = id => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  };

  const validateStep = () => {
    if (step === 0) {
      if (!name.trim() || name.trim().length < 2) {
        Alert.alert('Required', 'Name must be at least 2 characters.');
        return false;
      }
      if (!description.trim() || description.trim().length < 20) {
        Alert.alert('Required', 'Description must be at least 20 characters.');
        return false;
      }
      if (selectedCategories.length === 0) {
        Alert.alert('Required', 'Please select at least one category.');
        return false;
      }
    }
    if (step === 1) {
      if (!latitude.trim() || !longitude.trim()) {
        Alert.alert('Required', 'Latitude and longitude are required.');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);

    const form = new FormData();
    if (isEdit) form.append('id', editData.id);
    form.append('name', name.trim());
    form.append('description', description.trim());
    form.append('latitude', latitude);
    form.append('longitude', longitude);
    if (tagLine.trim()) form.append('tag_line', tagLine.trim());
    if (website.trim()) form.append('domain_name', website.trim());
    if (pinCode.trim()) form.append('pin_code', pinCode.trim());
    selectedCategories.forEach(id => form.append('categories[]', id));
    if (image) {
      form.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'image.jpg',
      });
    }
    if (logo) {
      form.append('logo', {
        uri: logo.uri,
        type: logo.type || 'image/jpeg',
        name: logo.fileName || 'logo.jpg',
      });
    }

    const endpoint = isEdit ? 'v2/updateMySubmission' : 'v2/addSite';
    const res = await comnPostForm(endpoint, form).catch(() => null);
    setSubmitting(false);

    if (res?.data?.success) {
      Alert.alert(
        isEdit ? 'Resubmitted!' : 'Submitted!',
        isEdit
          ? 'Your place has been resubmitted for review.'
          : 'Your place has been submitted and is under review.',
        [{text: 'View My Submissions', onPress: () => navigation.navigate(STRING.SCREEN.MY_SUBMISSIONS)}],
      );
    } else {
      const msg = res?.data?.message || 'Submission failed. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  const PhotoPicker = ({label, value, onPick, fallbackIcon}) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TouchableOpacity style={s.photoBtn} onPress={onPick} activeOpacity={0.85}>
        {value ? (
          <Image source={{uri: value.uri}} style={s.photoThumb} />
        ) : (
          <View style={s.photoPlaceholder}>
            <Ionicons name={fallbackIcon} size={28} color={C.textLight} />
            <Text style={s.photoPlaceholderText}>Tap to choose</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <View style={s.field}>
              <Text style={s.label}>Place Name<Text style={s.required}> *</Text></Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Hotel Sagar"
                placeholderTextColor={C.textLight}
                maxLength={100}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>
                Description<Text style={s.required}> *</Text>
                <Text style={s.labelNote}> (min 20 chars)</Text>
              </Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the place in detail…"
                placeholderTextColor={C.textLight}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Tagline</Text>
              <TextInput
                style={s.input}
                value={tagLine}
                onChangeText={setTagLine}
                placeholder="e.g. Stay by the sea"
                placeholderTextColor={C.textLight}
                maxLength={100}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Categories<Text style={s.required}> *</Text></Text>
              <View style={s.chips}>
                {categories.map(cat => {
                  const sel = selectedCategories.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.chip, sel && s.chipSelected]}
                      onPress={() => toggleCategory(cat.id)}
                      activeOpacity={0.8}>
                      <Text style={[s.chipText, sel && s.chipTextSelected]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        );

      case 1:
        return (
          <>
            <View style={s.infoCard}>
              <Ionicons name="information-circle-outline" size={16} color={C.oceanMid} />
              <Text style={s.infoText}>
                Paste a Google Maps link and we'll extract coordinates automatically.
              </Text>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Google Maps Link</Text>
              <View style={s.rowInput}>
                <TextInput
                  style={[s.input, {flex: 1}]}
                  value={mapsUrl}
                  onChangeText={setMapsUrl}
                  placeholder="https://maps.app.goo.gl/…"
                  placeholderTextColor={C.textLight}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[s.extractBtn, parsingUrl && {opacity: 0.7}]}
                  onPress={parseMapUrl}
                  disabled={parsingUrl}
                  activeOpacity={0.85}>
                  {parsingUrl ? (
                    <ActivityIndicator size="small" color={C.white} />
                  ) : (
                    <Text style={s.extractBtnText}>Extract</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>or enter manually</Text>
              <View style={s.orLine} />
            </View>

            <View style={s.rowFields}>
              <View style={[s.field, {flex: 1}]}>
                <Text style={s.label}>Latitude<Text style={s.required}> *</Text></Text>
                <TextInput
                  style={s.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="16.0601"
                  placeholderTextColor={C.textLight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[s.field, {flex: 1}]}>
                <Text style={s.label}>Longitude<Text style={s.required}> *</Text></Text>
                <TextInput
                  style={s.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="73.4677"
                  placeholderTextColor={C.textLight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {latitude && longitude ? (
              <View style={s.coordsPreview}>
                <Ionicons name="location" size={16} color={C.oceanMid} />
                <Text style={s.coordsText}>{latitude}, {longitude}</Text>
                <Text style={s.coordsLabel}>Coordinates set</Text>
              </View>
            ) : null}
          </>
        );

      case 2:
        return (
          <>
            <View style={s.infoCard}>
              <Ionicons name="information-circle-outline" size={16} color={C.oceanMid} />
              <Text style={s.infoText}>Optional. JPEG/PNG — max 2MB for main image, 1MB for logo.</Text>
            </View>
            <PhotoPicker
              label="Main Image"
              value={image}
              onPick={() => pickImage('image')}
              fallbackIcon="image-outline"
            />
            <PhotoPicker
              label="Logo"
              value={logo}
              onPick={() => pickImage('logo')}
              fallbackIcon="business-outline"
            />
          </>
        );

      case 3:
        return (
          <>
            <View style={s.infoCard}>
              <Ionicons name="information-circle-outline" size={16} color={C.oceanMid} />
              <Text style={s.infoText}>All fields optional. You can update these later.</Text>
            </View>
            <View style={s.field}>
              <Text style={s.label}>Website URL</Text>
              <TextInput
                style={s.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourplace.com"
                placeholderTextColor={C.textLight}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>Pin Code</Text>
              <TextInput
                style={s.input}
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="416606"
                placeholderTextColor={C.textLight}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={s.root}>
      <StatusBar backgroundColor={C.oceanDeep} barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={step > 0 ? () => setStep(s => s - 1) : () => backPage(navigation)}
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="arrow-back" size={20} color={C.white} />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>
              {isEdit ? 'Edit Submission' : 'Submit Your Place'}
            </Text>
            <Text style={s.headerSub}>{STEPS[step]} · Step {step + 1} of {STEPS.length}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate(STRING.SCREEN.MY_SUBMISSIONS)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={s.headerLink}>My List</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View
            style={[s.progressFill, {width: `${((step + 1) / STEPS.length) * 100}%`}]}
          />
        </View>

        <View style={s.headerCurve} pointerEvents="none" />
      </LinearGradient>

      {/* Step tabs */}
      <View style={s.stepTabs}>
        {STEPS.map((label, i) => (
          <TouchableOpacity
            key={i}
            style={[s.stepTab, i === step && s.stepTabActive]}
            onPress={() => i <= step && setStep(i)}
            activeOpacity={0.7}>
            <View style={[s.stepDot, i < step && s.stepDotDone, i === step && s.stepDotActive]}>
              {i < step ? (
                <Ionicons name="checkmark" size={11} color={C.white} />
              ) : (
                <Text style={[s.stepDotNum, i === step && {color: C.white}]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[s.stepTabLabel, i === step && s.stepTabLabelActive]} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Form */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, {paddingBottom: insets.bottom + 100}]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={[s.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <TouchableOpacity
          style={[s.submitBtn, submitting && {opacity: 0.7}]}
          onPress={step < STEPS.length - 1 ? next : submit}
          disabled={submitting}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <>
              <Text style={s.submitBtnText}>
                {step < STEPS.length - 1 ? 'Continue' : isEdit ? 'Resubmit' : 'Submit Place'}
              </Text>
              <Ionicons
                name={step < STEPS.length - 1 ? 'arrow-forward' : 'checkmark-circle-outline'}
                size={18}
                color={C.white}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 52,
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {flex: 1},
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  headerSub: {fontSize: 12, color: C.oceanFoam, marginTop: 2},
  headerLink: {fontSize: 13, color: C.oceanFoam, fontWeight: '600'},

  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: C.oceanFoam,
    borderRadius: 2,
  },

  headerCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: C.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Step tabs
  stepTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 4,
  },
  stepTab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepTabActive: {backgroundColor: 'rgba(27,107,123,0.07)'},
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {backgroundColor: C.oceanMid},
  stepDotDone: {backgroundColor: '#059669'},
  stepDotNum: {fontSize: 11, fontWeight: '700', color: C.textLight},
  stepTabLabel: {fontSize: 9, color: C.textLight, textAlign: 'center'},
  stepTabLabelActive: {color: C.oceanMid, fontWeight: '600'},

  // Form
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 16},
  field: {marginBottom: 16},
  label: {fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 6},
  required: {color: '#DC2626'},
  labelNote: {fontSize: 11, fontWeight: '400', color: C.textLight},
  input: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: C.textDark,
  },
  textArea: {minHeight: 100},

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EEF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {flex: 1, fontSize: 12, color: C.oceanMid, lineHeight: 18},

  rowInput: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  extractBtn: {
    backgroundColor: C.oceanMid,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    minWidth: 80,
    alignItems: 'center',
  },
  extractBtnText: {fontSize: 13, fontWeight: '700', color: C.white},

  orRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14},
  orLine: {flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.1)'},
  orText: {fontSize: 12, color: C.textLight},

  rowFields: {flexDirection: 'row', gap: 12},

  coordsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF6FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  coordsText: {fontSize: 13, color: C.oceanMid, fontWeight: '600', flex: 1},
  coordsLabel: {fontSize: 11, color: '#059669', fontWeight: '600'},

  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: C.white,
  },
  chipSelected: {backgroundColor: C.oceanMid, borderColor: C.oceanMid},
  chipText: {fontSize: 13, color: C.textMid},
  chipTextSelected: {color: C.white, fontWeight: '600'},

  photoBtn: {
    height: 130,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: C.white,
  },
  photoThumb: {width: '100%', height: '100%', resizeMode: 'cover'},
  photoPlaceholder: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8},
  photoPlaceholderText: {fontSize: 12, color: C.textLight},

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
  },
  submitBtn: {
    backgroundColor: C.oceanMid,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {fontSize: 16, fontWeight: '700', color: C.white},
});

export default SubmitPlaceScreen;
