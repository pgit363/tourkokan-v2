import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  BackHandler,
} from 'react-native';
import {SystemBars} from 'react-native-edge-to-edge';
import {useAppDialog} from '../Components/Common/AppDialog';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {launchImageLibrary} from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, {Marker} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {backPage} from '../Services/CommonMethods';
import {comnPost, comnPostForm} from '../Services/Api/CommonServices';
import STRING from '../Services/Constants/STRINGS';
import {scaleFontSizes} from '../Services/responsive';


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
  const {show: showDialog, dialog} = useAppDialog();
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

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  // Step 3
  const [image, setImage] = useState(null);
  const [logo, setLogo] = useState(null);

  // Step 4
  const [website, setWebsite] = useState(editData?.domain_name ?? '');
  const [pinCode, setPinCode] = useState(editData?.pin_code ?? '');
  const [phone, setPhone] = useState(editData?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(editData?.whatsapp ?? '');

  const isEdit = !!editData;

  const [loadingEdit, setLoadingEdit] = useState(isEdit);

  const hasUnsavedChanges = !!(name || description || tagLine || selectedCategories.length || latitude || longitude || image || logo || website || pinCode);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(s => s - 1);
      return;
    }
    if (hasUnsavedChanges) {
      showDialog({
        type: 'confirm',
        title: isEdit ? 'Discard Changes?' : 'Discard Submission?',
        message: 'You have unsaved changes. Are you sure you want to go back?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        onConfirm: () => backPage(navigation),
      });
    } else {
      backPage(navigation);
    }
  }, [step, hasUnsavedChanges, isEdit, navigation, showDialog]);

  useFocusEffect(
    useCallback(() => {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => handler.remove();
    }, [handleBack]),
  );
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [parentDropOpen, setParentDropOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState(editData?.parent_id ?? null);

  useEffect(() => {
    comnPost('v2/listcategories', {per_page: 100, include_empty: 1})
      .then(res => setCategories(res?.data?.data?.data || []))
      .catch(() => {});
    comnPost('v2/sites', {apitype: 'list', category: 'City'})
      .then(res => setCities(res?.data?.data?.data || []))
      .catch(() => {});
  }, []);

  const populateFromSite = site => {
    setName(site.name ?? '');
    setDescription(site.description ?? '');
    setTagLine(site.tag_line ?? '');
    setLatitude(site.latitude ? String(site.latitude) : '');
    setLongitude(site.longitude ? String(site.longitude) : '');
    setWebsite(site.domain_name ?? '');
    setPinCode(site.pin_code ?? '');
    setPhone(site.phone ?? '');
    setWhatsapp(site.whatsapp ?? '');
    setCityId(site.parent_id ?? null);
    const subIds = (site.categories || [])
      .filter(c => c.parent_id != null)
      .map(c => c.id);
    setSelectedCategories(subIds);
  };

  useEffect(() => {
    if (!isEdit) return;

    const getSitePayload = {id: editData.id};
    comnPost('v2/getSite', getSitePayload)
      .then(res => {
        const site = res?.data?.data;
        if (!site) return;
        populateFromSite(site);
      })
      .catch(() => {})
      .finally(() => setLoadingEdit(false));
  }, []);

  const groupedCategories = useMemo(() => {
    if (categories.length === 0) return [];
    const first = categories[0];
    if (first.children || first.sub_categories) {
      return categories
        .map(p => ({...p, subs: p.children ?? p.sub_categories ?? []}))
        .filter(p => p.subs.length > 0);
    }
    const parents = categories.filter(c => !c.parent_id);
    return parents
      .map(p => ({...p, subs: categories.filter(c => c.parent_id === p.id)}))
      .filter(p => p.subs.length > 0);
  }, [categories]);

  useEffect(() => {
    if (!isEdit || selectedParentId != null || groupedCategories.length === 0) return;
    const parent = groupedCategories.find(p =>
      p.subs.some(s => selectedCategories.includes(s.id)),
    );
    if (parent) setSelectedParentId(parent.id);
  }, [groupedCategories]);

  const activeParent = useMemo(
    () => groupedCategories.find(p => p.id === selectedParentId) ?? null,
    [groupedCategories, selectedParentId],
  );

  const selectedChips = useMemo(
    () =>
      groupedCategories
        .map(p => ({parent: p, subs: p.subs.filter(s => selectedCategories.includes(s.id))}))
        .filter(x => x.subs.length > 0),
    [groupedCategories, selectedCategories],
  );

  const selectParent = parent => {
    setSelectedParentId(parent.id);
    setParentDropOpen(false);
  };

  const setCoords = (lat, lng) => {
    setLatitude(String(lat));
    setLongitude(String(lng));
  };

  const parseMapUrl = async () => {
    if (!mapsUrl.trim()) return;
    setParsingUrl(true);
    const res = await comnPost('v2/parseMapUrl', {url: mapsUrl.trim()}).catch(() => null);
    setParsingUrl(false);
    if (res?.data?.success) {
      setCoords(res.data.data.latitude, res.data.data.longitude);
      setMapsUrl('');
    } else {
      showDialog({
        type: 'error',
        title: 'Could Not Parse',
        message: res?.data?.message || 'Could not extract coordinates. Please enter manually.',
      });
    }
  };

  const detectLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showDialog({type: 'warning', title: 'Permission Denied', message: 'Location permission is required.'});
          return;
        }
      } catch {
        return;
      }
    }
    setDetectingLocation(true);
    Geolocation.getCurrentPosition(
      pos => {
        setCoords(pos.coords.latitude, pos.coords.longitude);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        showDialog({type: 'error', title: 'Error', message: 'Could not detect location. Please enter manually.'});
      },
      {enableHighAccuracy: false, timeout: 15000, maximumAge: 10000},
    );
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

  const resetForm = () => {
    setStep(0);
    setName('');
    setDescription('');
    setTagLine('');
    setSelectedCategories([]);
    setLatitude('');
    setLongitude('');
    setMapsUrl('');
    setImage(null);
    setLogo(null);
    setWebsite('');
    setPinCode('');
    setPhone('');
    setWhatsapp('');
    setCityId(null);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!name.trim() || name.trim().length < 2) {
        showDialog({type: 'warning', title: 'Required', message: 'Name must be at least 2 characters.'});
        return false;
      }
      if (!description.trim() || description.trim().length < 20) {
        showDialog({type: 'warning', title: 'Required', message: 'Description must be at least 20 characters.'});
        return false;
      }
      if (!activeParent) {
        showDialog({type: 'warning', title: 'Required', message: 'Please select a category.'});
        return false;
      }
      if (selectedCategories.length === 0) {
        showDialog({type: 'warning', title: 'Required', message: 'Please select at least one sub-category.'});
        return false;
      }
    }
    if (step === 1) {
      if (!latitude.trim() || !longitude.trim()) {
        showDialog({type: 'warning', title: 'Required', message: 'Latitude and longitude are required.'});
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
    if (phone.trim()) form.append('phone', phone.trim());
    if (whatsapp.trim()) form.append('whatsapp', whatsapp.trim());
    if (cityId) form.append('parent_id', String(cityId));
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
    const formLog = {
      id: isEdit ? editData.id : undefined,
      name: name.trim(),
      description: description.trim(),
      tag_line: tagLine.trim(),
      latitude,
      longitude,
      domain_name: website.trim(),
      pin_code: pinCode.trim(),
      categories: selectedCategories,
      hasImage: !!image,
      hasLogo: !!logo,
    };
    const res = await comnPostForm(endpoint, form);
    setSubmitting(false);

    const resData = res?.data ?? res?.response?.data;
    if (resData?.success) {
      if (!isEdit) resetForm();
      const vendorFlow = route?.params?.vendorFlow;
      const newSiteId = resData?.data?.site?.id ?? resData?.data?.id;
      const addProducts = vendorFlow && !isEdit;
      showDialog({
        type: 'success',
        title: isEdit ? 'Resubmitted!' : 'Submitted!',
        message: isEdit
          ? 'Your place has been resubmitted for review.'
          : addProducts
            ? 'Your business is under review. Add your products now — they go live once approved.'
            : 'Your place has been submitted and is under review.',
        confirmText: addProducts ? 'Add products' : 'View My Sites',
        onConfirm: () =>
          addProducts
            ? navigation.replace(
                STRING.SCREEN.ADD_PRODUCT,
                newSiteId ? {siteId: newSiteId} : undefined,
              )
            : navigation.replace(STRING.SCREEN.MY_SUBMISSIONS),
        onClose: () => navigation.replace(STRING.SCREEN.MY_SUBMISSIONS),
      });
    } else {
      const msg = resData?.message;
      const displayMsg = typeof msg === 'string'
        ? msg
        : typeof msg === 'object' && msg !== null
          ? Object.values(msg).flat().join('\n')
          : 'Submission failed. Please try again.';
      showDialog({type: 'error', title: 'Error', message: displayMsg});
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

              {/* Selected sub-categories grouped by parent */}
              {selectedChips.length > 0 && (
                <View style={s.selectedSection}>
                  {selectedChips.map(({parent, subs}) => (
                    <View key={parent.id} style={s.selectedGroup}>
                      <Text style={s.selectedGroupLabel}>{parent.name}</Text>
                      <View style={s.chips}>
                        {subs.map(sub => (
                          <TouchableOpacity
                            key={sub.id}
                            style={s.chipSelectedRemovable}
                            onPress={() => toggleCategory(sub.id)}
                            activeOpacity={0.8}>
                            <Text style={s.chipTextSelected}>{sub.name}</Text>
                            <Ionicons name="close" size={12} color={C.white} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Parent dropdown */}
              <TouchableOpacity
                style={s.dropdownTrigger}
                onPress={() => setParentDropOpen(o => !o)}
                activeOpacity={0.8}>
                <Text style={[s.dropdownTriggerText, !activeParent && {color: C.textLight}]}>
                  {activeParent ? activeParent.name : 'Select category to add…'}
                </Text>
                {categories.length === 0 ? (
                  <ActivityIndicator size="small" color={C.textLight} />
                ) : (
                  <Ionicons name={parentDropOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.textLight} />
                )}
              </TouchableOpacity>
              {parentDropOpen && (
                <View style={s.dropdownList}>
                  {groupedCategories.map((parent, idx) => {
                    const selCount = parent.subs.filter(s => selectedCategories.includes(s.id)).length;
                    return (
                      <TouchableOpacity
                        key={parent.id}
                        style={[s.dropdownOption, idx > 0 && {borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)'}]}
                        onPress={() => selectParent(parent)}
                        activeOpacity={0.7}>
                        <Text style={[s.dropdownOptionText, selectedParentId === parent.id && s.dropdownOptionSelected]}>
                          {parent.name}
                        </Text>
                        {selCount > 0 && (
                          <View style={s.dropdownBadge}>
                            <Text style={s.dropdownBadgeText}>{selCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Sub-category chips for active parent */}
            {activeParent && (
              <View style={s.field}>
                <Text style={s.label}>{activeParent.name} — sub-categories</Text>
                <View style={s.chips}>
                  {(activeParent.subs ?? []).map(sub => {
                    const sel = selectedCategories.includes(sub.id);
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={[s.chip, sel && s.chipSelected]}
                        onPress={() => toggleCategory(sub.id)}
                        activeOpacity={0.8}>
                        <Text style={[s.chipText, sel && s.chipTextSelected]}>{sub.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        );

      case 1: {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const hasCoords = !isNaN(lat) && !isNaN(lng);
        return (
          <>
            {/* Interactive map */}
            <View style={s.mapWrap}>
              {hasCoords ? (
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  region={{latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01}}
                  onPress={e => {
                    const {latitude: lt, longitude: ln} = e.nativeEvent.coordinate;
                    setCoords(lt, ln);
                  }}>
                  <Marker coordinate={{latitude: lat, longitude: lng}} />
                </MapView>
              ) : (
                <View style={s.mapPlaceholder}>
                  <Ionicons name="location-outline" size={30} color="rgba(255,255,255,0.6)" />
                  <Text style={s.mapPlaceholderText}>Tap map after setting location</Text>
                </View>
              )}
              {hasCoords && (
                <TouchableOpacity
                  style={s.mapClearBtn}
                  onPress={() => { setLatitude(''); setLongitude(''); }}
                  activeOpacity={0.8}>
                  <Ionicons name="close" size={14} color={C.white} />
                </TouchableOpacity>
              )}
            </View>

            {hasCoords && (
              <View style={s.coordsPreview}>
                <Ionicons name="location" size={15} color={C.oceanMid} />
                <Text style={s.coordsText}>{lat.toFixed(6)}, {lng.toFixed(6)}</Text>
              </View>
            )}

            {/* Action row: detect + paste link */}
            <View style={s.locActionsRow}>
              <TouchableOpacity
                style={s.locActionBtn}
                onPress={detectLocation}
                disabled={detectingLocation}
                activeOpacity={0.8}>
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={C.oceanMid} />
                ) : (
                  <Ionicons name="navigate-outline" size={16} color={C.oceanMid} />
                )}
                <Text style={s.locActionText}>
                  {detectingLocation ? 'Detecting…' : 'My location'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.locActionBtn}
                onPress={() => setShowManualInput(v => !v)}
                activeOpacity={0.8}>
                <Ionicons name="create-outline" size={16} color={C.oceanMid} />
                <Text style={s.locActionText}>Enter manually</Text>
              </TouchableOpacity>
            </View>

            {/* Google Maps URL extract */}
            <View style={s.field}>
              <Text style={s.label}>Paste Google Maps link</Text>
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

            {/* Manual lat/lng inputs — collapsible */}
            {showManualInput && (
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
            )}
          </>
        );
      }

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
            <View style={s.field}>
              <Text style={s.label}>City</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 4}} keyboardShouldPersistTaps="handled">
                {cities.map(c => {
                  const on = cityId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setCityId(c.id)}
                      style={{paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, marginRight: 8, borderColor: on ? C.oceanMid : 'rgba(0,0,0,0.1)', backgroundColor: on ? 'rgba(27,107,123,0.08)' : '#fff'}}>
                      <Text style={{fontSize: 12.5, fontWeight: '700', color: on ? C.oceanMid : C.textMid}}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
                {cities.length === 0 && <Text style={{fontSize: 12, color: C.textLight}}>Loading cities…</Text>}
              </ScrollView>
            </View>
            <View style={s.field}>
              <Text style={s.label}>Phone (shown to buyers)</Text>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={C.textLight}
                keyboardType="phone-pad"
              />
            </View>
            <View style={s.field}>
              <Text style={s.label}>WhatsApp number</Text>
              <TextInput
                style={s.input}
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="Same as phone, or a different number"
                placeholderTextColor={C.textLight}
                keyboardType="phone-pad"
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  if (loadingEdit) {
    return (
      <View style={s.loadingWrap}>
        <SystemBars style="light" />
        <ActivityIndicator size="large" color={C.oceanMid} />
        <Text style={s.loadingText}>Loading submission…</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <SystemBars style="light" />

      {/* Header */}
      <LinearGradient
        colors={[C.oceanDeep, C.forestDeep]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.header, {paddingTop: insets.top + 10}]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={handleBack}
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
            onPress={() => navigation.replace(STRING.SCREEN.MY_SUBMISSIONS)}
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
      {dialog}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create(scaleFontSizes({
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

  mapWrap: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: C.oceanDeep,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B6B7B',
    gap: 8,
  },
  mapPlaceholderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
  mapClearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  coordsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  coordsText: {fontSize: 13, color: C.oceanMid, fontWeight: '600', flex: 1},

  locActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  locActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.oceanMid,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(27,107,123,0.05)',
  },
  locActionText: {fontSize: 13, fontWeight: '600', color: C.oceanMid},

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cream,
    gap: 12,
  },
  loadingText: {fontSize: 14, color: C.textLight},

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownTriggerText: {fontSize: 14, color: C.textDark, flex: 1},
  dropdownList: {
    marginTop: 4,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownOptionText: {flex: 1, fontSize: 14, color: C.textDark},
  dropdownOptionSelected: {color: C.oceanMid, fontWeight: '700'},
  dropdownBadge: {
    backgroundColor: C.oceanMid,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  dropdownBadgeText: {fontSize: 11, fontWeight: '700', color: C.white},

  selectedSection: {
    backgroundColor: 'rgba(27,107,123,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  selectedGroup: {gap: 6},
  selectedGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.oceanMid,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipSelectedRemovable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 22,
    backgroundColor: C.oceanMid,
  },

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
}));

export default SubmitPlaceScreen;
