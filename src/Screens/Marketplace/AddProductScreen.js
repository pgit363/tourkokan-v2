/**
 * Sell · Add / Edit product — the server-driven, multi-step form.
 *
 *   1 Basics   mySites → allowedProductCategories → name/price/unit
 *   2 Details  categoryAttributeSchema → SchemaField per attribute (schema-only v1)
 *   3 Photos   uploadProductMedia (first = cover)
 *   4 Review   addProduct (draft) → upload media → submitProductForReview
 *
 * Edit mode (route.params.editId): getProduct prefills every step; submit calls
 * updateProduct (which returns an approved listing to review) instead of addProduct.
 * Custom (free-form) properties are deferred until the backend adds custom_specs.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import {SystemBars} from 'react-native-edge-to-edge';
import {launchImageLibrary} from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import CachedImage from '../../Components/Customs/CachedImage';
import SchemaField from '../../Components/Marketplace/SchemaField';
import {C} from '../../Components/Marketplace/theme';
import {useMarketBack} from '../../Components/Marketplace/useMarketBack';
import {mediaUri, productGallery} from '../../Services/marketplace';
import {
  mySites,
  allowedProductCategories,
  categoryAttributeSchema,
  addProduct,
  updateProduct,
  getProduct,
  uploadProductMedia,
  deleteProductMedia,
  submitProductForReview,
} from '../../Services/Api/MarketplaceServices';
import {backPage} from '../../Services/CommonMethods';
import STRING from '../../Services/Constants/STRINGS';

const UNITS = ['per_night', 'per_person', 'per_plate', 'per_kg', 'per_piece', 'per_dozen', 'per_hour', 'per_package'];
const STEP_KEYS = ['STEP_BASICS', 'STEP_DETAILS', 'STEP_PHOTOS', 'STEP_REVIEW'];

const AddProductScreen = ({navigation, route}) => {
  useMarketBack(navigation);
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const editId = route?.params?.editId;
  const isEdit = editId != null;

  const [step, setStep] = useState(0);
  const [sites, setSites] = useState([]);
  const [site, setSite] = useState(null);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState(null);
  const [schema, setSchema] = useState({});
  const [loadingCats, setLoadingCats] = useState(false);
  const [catsError, setCatsError] = useState(false);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('per_piece');
  const [attrs, setAttrs] = useState({});
  const [images, setImages] = useState([]); // new local picks
  const [existing, setExisting] = useState([]); // already-uploaded {media_id, uri}
  const [removedIds, setRemovedIds] = useState([]); // existing media to delete on save
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // per_x → localised unit label, falling back to the humanised raw value.
  const unitLabel = u =>
    t('MARKETPLACE.UNITS.' + u.replace(/^per_/, ''), {
      defaultValue: u.replace(/^per_/, '').replace(/_/g, ' '),
    });

  // load outlets (add mode auto-selects; edit mode keeps the product's site)
  useEffect(() => {
    (async () => {
      const res = await mySites(navigation);
      if (res?.data?.success) {
        const rows = res.data.data?.data ?? res.data.data ?? [];
        setSites(rows);
        if (!isEdit) {
          const preId = route?.params?.siteId;
          const pre = preId ? rows.find(x => String(x.id) === String(preId)) : null;
          setSite(pre || rows.find(x => x.is_primary) || rows[0] || null);
        }
      }
    })();
  }, [navigation, route, isEdit]);

  // edit prefill — getProduct carries site, category (+ attribute_schema),
  // attributes, price, unit and the gallery.
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const res = await getProduct(editId, navigation);
      if (res?.data?.success) {
        const p = res.data.data;
        setSite(p.site || null);
        const pc = p.product_category || {};
        setCat(pc);
        setSchema(pc.attribute_schema || pc.schema || {});
        setName(p.name || '');
        setDesc(p.description || '');
        setPrice(p.base_price != null ? String(p.base_price) : '');
        setUnit(p.unit || 'per_piece');
        setAttrs(p.attributes || {});
        setExisting(
          productGallery(p).map(g => ({
            media_id: g.id,
            uri: mediaUri(g.path_url || g.path),
          })),
        );
      }
    })();
  }, [isEdit, editId, navigation]);

  // load the category list for a site — no cat/schema reset here, so an edit
  // prefill survives; the reset lives in the site-switch handler instead.
  const loadCats = useCallback(
    async siteObj => {
      if (!siteObj?.id) {
        setCats([]);
        setLoadingCats(false);
        return;
      }
      setLoadingCats(true);
      setCatsError(false);
      try {
        const res = await allowedProductCategories(siteObj.id, navigation);
        if (res?.data?.success) {
          const d = res.data.data;
          setCats(Array.isArray(d) ? d : d?.data ?? []);
        } else {
          setCats([]);
          setCatsError(true);
        }
      } catch (e) {
        setCats([]);
        setCatsError(true);
      } finally {
        setLoadingCats(false);
      }
    },
    [navigation],
  );

  useEffect(() => {
    loadCats(site);
  }, [site, loadCats]);

  const switchSite = o => {
    if (o.id === site?.id) return;
    setSite(o);
    setCat(null);
    setSchema({});
  };

  const pickCategory = useCallback(
    async c => {
      setCat(c);
      setAttrs({});
      const res = await categoryAttributeSchema(c.id, navigation);
      if (res?.data?.success) {
        const d = res.data.data;
        setSchema(d?.attribute_schema || d?.schema || {});
      }
    },
    [navigation],
  );

  const addPhoto = async () => {
    const r = await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1});
    if (r?.assets?.length) setImages(prev => [...prev, r.assets[0]]);
  };

  const removeExisting = media_id => {
    setRemovedIds(r => [...r, media_id]);
    setExisting(ex => ex.filter(x => x.media_id !== media_id));
  };

  const canNext = () => {
    if (step === 0) return site && cat && name.trim() && price.trim();
    return true;
  };

  const uploadNewMedia = async productId => {
    for (const img of images) {
      const mfd = new FormData();
      mfd.append('id', String(productId));
      mfd.append('image', {
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.fileName || 'photo.jpg',
      });
      // eslint-disable-next-line no-await-in-loop
      await uploadProductMedia(mfd, navigation);
    }
  };

  // validation errors come back keyed attributes.<field> — surface them on step 2
  const applyFieldErrors = msg => {
    const flat = {};
    Object.keys(msg).forEach(k => {
      flat[k.replace(/^attributes\./, '')] = Array.isArray(msg[k]) ? msg[k][0] : msg[k];
    });
    setErrors(flat);
    setStep(1);
  };

  const submitEdit = async () => {
    const fd = new FormData();
    fd.append('id', String(editId));
    fd.append('name', name.trim());
    if (desc.trim()) fd.append('description', desc.trim());
    fd.append('base_price', String(price).replace(/[^0-9.]/g, ''));
    fd.append('unit', unit);
    fd.append('attributes', JSON.stringify(attrs));
    if (cat?.id) fd.append('product_category_id', String(cat.id));

    const res = await updateProduct(fd, navigation);
    const body = res?.data;
    if (!body?.success) {
      setSubmitting(false);
      const msg = body?.message;
      if (msg && typeof msg === 'object') applyFieldErrors(msg);
      else Alert.alert(t('MARKETPLACE.SAVE_FAIL_TITLE'), typeof msg === 'string' ? msg : t('MARKETPLACE.TRY_AGAIN'));
      return;
    }
    for (const mid of removedIds) {
      // eslint-disable-next-line no-await-in-loop
      await deleteProductMedia(editId, mid, navigation);
    }
    await uploadNewMedia(editId);
    setSubmitting(false);
    Alert.alert(t('MARKETPLACE.UPDATED_TITLE'), t('MARKETPLACE.UPDATED_MSG'), [
      {text: t('MARKETPLACE.DONE'), onPress: () => backPage(navigation)},
    ]);
  };

  const submitNew = async () => {
    const fd = new FormData();
    fd.append('site_id', String(site.id));
    fd.append('product_category_id', String(cat.id));
    fd.append('name', name.trim());
    if (desc.trim()) fd.append('description', desc.trim());
    fd.append('base_price', String(price).replace(/[^0-9.]/g, ''));
    fd.append('unit', unit);
    fd.append('attributes', JSON.stringify(attrs));

    const res = await addProduct(fd, navigation);
    const body = res?.data;
    if (!body?.success) {
      setSubmitting(false);
      const msg = body?.message;
      if (msg && typeof msg === 'object') applyFieldErrors(msg);
      else Alert.alert(t('MARKETPLACE.SAVE_FAIL_TITLE'), typeof msg === 'string' ? msg : t('MARKETPLACE.TRY_AGAIN'));
      return;
    }

    const product = body.data;
    await uploadNewMedia(product.id);
    await submitProductForReview(product.id, navigation);
    setSubmitting(false);
    Alert.alert(t('MARKETPLACE.SUBMITTED_TITLE'), t('MARKETPLACE.SUBMITTED_MSG'), [
      {
        text: t('MARKETPLACE.ADD_ANOTHER'),
        onPress: () => {
          // keep the same outlet; clear the rest for the next product
          setCat(null);
          setSchema({});
          setName('');
          setDesc('');
          setPrice('');
          setUnit('per_piece');
          setAttrs({});
          setImages([]);
          setErrors({});
          setStep(0);
        },
      },
      {text: t('MARKETPLACE.DONE'), style: 'cancel', onPress: () => backPage(navigation)},
    ]);
  };

  const submit = async () => {
    setSubmitting(true);
    setErrors({});
    if (isEdit) return submitEdit();
    return submitNew();
  };

  const photoCount = existing.length + images.length;

  return (
    <View style={s.root}>
      <SystemBars style="light" />
      <LinearGradient
        colors={[C.oceanDeep, '#1A3320']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[s.head, {paddingTop: insets.top + 10}]}>
        <View style={s.headTop}>
          <TouchableOpacity
            onPress={() => (step === 0 ? backPage(navigation) : setStep(step - 1))}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name={step === 0 ? 'close' : 'chevron-back'} size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headTitle}>{isEdit ? t('MARKETPLACE.EDIT_LISTING') : t('MARKETPLACE.NEW_LISTING')}</Text>
          <View style={{width: 24}} />
        </View>
        <View style={s.steps}>
          {STEP_KEYS.map((key, i) => (
            <View key={key} style={s.stepCol}>
              <View style={[s.stepBar, i <= step && s.stepBarOn]} />
              <Text style={[s.stepLbl, i === step && s.stepLblOn]}>{t('MARKETPLACE.' + key)}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView  style={{flex: 1}} contentContainerStyle={s.form} keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={24}
        keyboardOpeningTime={0}>
        {step === 0 && (
          <>
            <Text style={s.fl}>{t('MARKETPLACE.SELLING_FROM')}</Text>
            <View style={s.seg}>
              {sites.map(o => (
                <TouchableOpacity
                  key={o.id}
                  style={[s.opt, site?.id === o.id && s.optOn, isEdit && site?.id !== o.id && s.optDim]}
                  disabled={isEdit}
                  onPress={() => switchSite(o)}>
                  <Text style={[s.optTxt, site?.id === o.id && s.optTxtOn]} numberOfLines={1}>
                    {o.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {sites.length === 0 && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(STRING.SCREEN.SUBMIT_PLACE, {vendorFlow: true})
                  }>
                  <Text style={s.retry}>{t('MARKETPLACE.NO_OUTLETS_ADD')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[s.fl, {marginTop: 14}]}>{t('MARKETPLACE.CATEGORY')}</Text>
            {loadingCats ? (
              <ActivityIndicator color={C.oceanMid} style={{alignSelf: 'flex-start'}} />
            ) : catsError ? (
              <TouchableOpacity onPress={() => loadCats(site)}>
                <Text style={s.retry}>{t('MARKETPLACE.CATS_RETRY')}</Text>
              </TouchableOpacity>
            ) : cats.length === 0 ? (
              <Text style={s.muted}>
                {site ? t('MARKETPLACE.NO_CATS') : t('MARKETPLACE.PICK_OUTLET')}
              </Text>
            ) : (
              <View style={s.seg}>
                {cats.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.opt, cat?.id === c.id && s.optOn]}
                    onPress={() => pickCategory(c)}>
                    <Text style={[s.optTxt, cat?.id === c.id && s.optTxtOn]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[s.fl, {marginTop: 14}]}>{t('MARKETPLACE.PRODUCT_NAME')}</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('MARKETPLACE.PRODUCT_NAME_PH')} placeholderTextColor={C.textLight} />

            <Text style={[s.fl, {marginTop: 13}]}>{t('MARKETPLACE.DESCRIPTION')}</Text>
            <TextInput style={[s.input, s.ta]} value={desc} onChangeText={setDesc} placeholder={t('MARKETPLACE.DESCRIPTION_PH')} placeholderTextColor={C.textLight} multiline />

            <View style={{flexDirection: 'row', gap: 10, marginTop: 13}}>
              <View style={{flex: 1}}>
                <Text style={s.fl}>{t('MARKETPLACE.BASE_PRICE')}</Text>
                <TextInput style={s.input} value={price} onChangeText={v => setPrice(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="₹" placeholderTextColor={C.textLight} />
              </View>
              <View style={{flex: 1.3}}>
                <Text style={s.fl}>{t('MARKETPLACE.UNIT_ENTITY')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.unitRow}>
                  {UNITS.map(u => (
                    <TouchableOpacity key={u} style={[s.unit, unit === u && s.optOn]} onPress={() => setUnit(u)}>
                      <Text style={[s.optTxt, unit === u && s.optTxtOn]}>{unitLabel(u)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <View style={s.dynLab}>
              <Ionicons name="construct-outline" size={13} color={C.oceanMid} />
              <Text style={s.dynLabTxt}>{t('MARKETPLACE.CATEGORY_DETAILS', {name: cat?.name})}</Text>
            </View>
            {Object.keys(schema).length === 0 ? (
              <Text style={s.muted}>{t('MARKETPLACE.NO_EXTRA_DETAILS')}</Text>
            ) : (
              Object.keys(schema).map(key => (
                <SchemaField
                  key={key}
                  name={key}
                  def={schema[key]}
                  value={attrs[key]}
                  error={errors[key]}
                  onChange={v => setAttrs(prev => ({...prev, [key]: v}))}
                />
              ))
            )}
          </>
        )}

        {step === 2 && (
          <>
            {existing.length > 0 && (
              <>
                <Text style={s.fl}>{t('MARKETPLACE.EXISTING_PHOTOS')}</Text>
                <View style={s.photoGrid}>
                  {existing.map((img, i) => (
                    <View key={img.media_id} style={s.tile}>
                      <CachedImage source={{uri: img.uri}} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      {i === 0 && <View style={s.coverTag}><Text style={s.coverTagTxt}>{t('MARKETPLACE.COVER')}</Text></View>}
                      <TouchableOpacity style={s.del} onPress={() => removeExisting(img.media_id)}>
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
            <Text style={[s.fl, existing.length > 0 && {marginTop: 14}]}>{t('MARKETPLACE.PHOTOS_HINT')}</Text>
            <View style={s.photoGrid}>
              {images.map((img, i) => (
                <View key={i} style={s.tile}>
                  <CachedImage source={{uri: img.uri}} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  {existing.length === 0 && i === 0 && <View style={s.coverTag}><Text style={s.coverTagTxt}>{t('MARKETPLACE.COVER')}</Text></View>}
                  <TouchableOpacity style={s.del} onPress={() => setImages(images.filter((_, x) => x !== i))}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addTile} onPress={addPhoto}>
                <Ionicons name="add" size={22} color={C.oceanMid} />
                <Text style={s.addTileTxt}>{t('MARKETPLACE.ADD')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <View style={s.reviewCard}>
              <Text style={s.rvName}>{name}</Text>
              <Text style={s.muted}>{cat?.name} · {site?.name}</Text>
              <View style={s.rvRow}><Text style={s.rvK}>{t('MARKETPLACE.PRICE')}</Text><Text style={s.rvV}>₹{price} {unitLabel(unit)}</Text></View>
              <View style={s.rvRow}><Text style={s.rvK}>{t('MARKETPLACE.DETAILS')}</Text><Text style={s.rvV}>{t('MARKETPLACE.ATTRS_SET', {count: Object.keys(attrs).length})}</Text></View>
              <View style={s.rvRow}><Text style={s.rvK}>{t('MARKETPLACE.PHOTOS')}</Text><Text style={s.rvV}>{photoCount}</Text></View>
            </View>
            <View style={s.note}>
              <Ionicons name="shield-checkmark-outline" size={14} color={C.forestMid} />
              <Text style={s.noteTxt}>{isEdit ? t('MARKETPLACE.UPDATED_MSG') : t('MARKETPLACE.SUBMIT_NOTE')}</Text>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      <View style={s.footer}>
        {step < 3 ? (
          <TouchableOpacity
            style={[s.btn, !canNext() && s.btnDisabled]}
            disabled={!canNext()}
            onPress={() => setStep(step + 1)}>
            <Text style={s.btnTxt}>{t('MARKETPLACE.CONTINUE')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btn, s.btnGo]} disabled={submitting} onPress={submit}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>{isEdit ? t('MARKETPLACE.SAVE_CHANGES') : t('MARKETPLACE.SUBMIT_REVIEW')}</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: C.cream},
  head: {paddingHorizontal: 15, paddingBottom: 13},
  headTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headTitle: {color: '#fff', fontSize: 16, fontWeight: '800'},
  steps: {flexDirection: 'row', gap: 5, marginTop: 12},
  stepCol: {flex: 1},
  stepBar: {height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)'},
  stepBarOn: {backgroundColor: '#fff'},
  stepLbl: {fontSize: 8.5, marginTop: 5, textAlign: 'center', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: '700'},
  stepLblOn: {color: '#fff'},
  form: {padding: 15, paddingBottom: 30},
  fl: {fontSize: 11.5, fontWeight: '700', color: C.textMid, marginBottom: 6},
  muted: {fontSize: 11.5, color: C.textLight},
  retry: {fontSize: 12.5, color: C.oceanMid, fontWeight: '700'},
  input: {backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 10, height: 42, paddingHorizontal: 11, fontSize: 13, color: C.textDark},
  ta: {height: 66, textAlignVertical: 'top', paddingTop: 11},
  seg: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  opt: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff'},
  optOn: {borderColor: C.oceanMid, backgroundColor: 'rgba(27,107,123,0.08)'},
  optDim: {opacity: 0.45},
  optTxt: {fontSize: 11.5, fontWeight: '700', color: C.textMid},
  optTxtOn: {color: C.oceanMid},
  unitRow: {marginTop: 0},
  unit: {paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', marginRight: 6},
  dynLab: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12},
  dynLabTxt: {fontSize: 11, fontWeight: '800', color: C.oceanMid, textTransform: 'uppercase', letterSpacing: 0.5},
  photoGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 8},
  tile: {width: 92, height: 92, borderRadius: 11, overflow: 'hidden', borderWidth: 1, borderColor: C.line},
  coverTag: {position: 'absolute', top: 4, left: 4, backgroundColor: C.oceanDeep, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4},
  coverTagTxt: {color: '#fff', fontSize: 8, fontWeight: '800', textTransform: 'uppercase'},
  del: {position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center'},
  addTile: {width: 92, height: 92, borderRadius: 11, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(27,107,123,0.45)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(27,107,123,0.04)'},
  addTileTxt: {fontSize: 10, fontWeight: '700', color: C.oceanMid, marginTop: 2},
  reviewCard: {backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14},
  rvName: {fontSize: 15, fontWeight: '800', color: C.textDark},
  rvRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 9},
  rvK: {fontSize: 12, color: C.textLight},
  rvV: {fontSize: 12, fontWeight: '700', color: C.textDark},
  note: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(46,92,58,0.1)', borderColor: 'rgba(46,92,58,0.25)', borderWidth: 1, borderRadius: 11, padding: 11, marginTop: 13},
  noteTxt: {fontSize: 11, color: C.forestMid, fontWeight: '600', flex: 1},
  footer: {backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line, padding: 13},
  btn: {height: 46, borderRadius: 12, backgroundColor: C.oceanMid, alignItems: 'center', justifyContent: 'center'},
  btnGo: {backgroundColor: C.forestMid},
  btnDisabled: {opacity: 0.4},
  btnTxt: {color: '#fff', fontWeight: '800', fontSize: 14.5},
});

export default AddProductScreen;
