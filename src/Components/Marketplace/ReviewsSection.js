/**
 * ReviewsSection — ratings + moderated comments for a product, using the generic
 * morph endpoints (type "Product"). Comments are invisible until an admin
 * approves, so posting shows a "pending approval" toast instead of an optimistic
 * insert. Mirrors the rating/review pattern in SiteDetailPage.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import StarRating from 'react-native-star-rating-widget';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {isGuestUser} from '../../Components/Common/GuestGateModal';
import {C} from './theme';
import {
  rateProduct,
  productComments,
  addProductComment,
} from '../../Services/Api/MarketplaceServices';

const toast = msg => {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
};

const initials = u =>
  u?.name
    ? u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

const ReviewsSection = ({productId, ratingAvg, ratingCount, navigation}) => {
  const {t} = useTranslation();
  const [userRating, setUserRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const res = await productComments(productId, navigation);
    if (res?.data?.success) setComments(res.data.data?.data ?? res.data.data ?? []);
  }, [productId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const onRate = async rate => {
    if (await isGuestUser()) {
      toast(t('MARKETPLACE.LOGIN_TO_REVIEW'));
      return;
    }
    setUserRating(rate);
    rateProduct(productId, rate, navigation);
    toast(t('MARKETPLACE.RATING_THANKS'));
  };

  const onPost = async () => {
    const body = text.trim();
    if (!body) return;
    if (await isGuestUser()) {
      toast(t('MARKETPLACE.LOGIN_TO_REVIEW'));
      return;
    }
    setPosting(true);
    const res = await addProductComment(productId, body, navigation);
    setPosting(false);
    if (res?.data?.success) {
      setText('');
      toast(t('MARKETPLACE.REVIEW_PENDING'));
    } else {
      toast(t('MARKETPLACE.TRY_AGAIN'));
    }
  };

  return (
    <View style={s.block}>
      <Text style={s.blockLab}>{t('MARKETPLACE.REVIEWS')}</Text>

      <View style={s.top}>
        <View style={s.scoreSide}>
          <Text style={s.big}>{ratingAvg > 0 ? Number(ratingAvg).toFixed(1) : '—'}</Text>
          <Text style={s.count}>
            {t('MARKETPLACE.RATINGS_COUNT', {count: ratingCount || 0})}
          </Text>
        </View>
        <View style={s.rateSide}>
          <Text style={s.rateLab}>{t('MARKETPLACE.RATE_THIS')}</Text>
          <StarRating
            rating={userRating}
            onChange={onRate}
            enableHalfStar={false}
            starSize={26}
            color={C.sandMid}
          />
        </View>
      </View>

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder={t('MARKETPLACE.WRITE_REVIEW')}
          placeholderTextColor={C.textLight}
          multiline
        />
        <TouchableOpacity
          style={[s.send, (!text.trim() || posting) && s.sendOff]}
          disabled={!text.trim() || posting}
          onPress={onPost}
          activeOpacity={0.85}>
          <Ionicons name="send" size={15} color="#fff" />
        </TouchableOpacity>
      </View>

      {comments.length > 0 ? (
        comments.map((c, i) => {
          const raw = c.users ?? c.user;
          const user = Array.isArray(raw) ? raw[0] : raw;
          return (
            <View key={c.id || i} style={s.cRow}>
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>{initials(user)}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={s.cName}>{user?.name || t('MARKETPLACE.REVIEWER')}</Text>
                <Text style={s.cTxt}>{c.comment}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={s.none}>{t('MARKETPLACE.NO_REVIEWS')}</Text>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  block: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 13,
    marginTop: 14,
  },
  blockLab: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: C.sandMid,
    marginBottom: 10,
  },
  top: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  scoreSide: {alignItems: 'center', paddingRight: 14},
  big: {fontSize: 26, fontWeight: '800', color: C.textDark, letterSpacing: -0.5},
  count: {fontSize: 10.5, color: C.textLight, marginTop: 2},
  rateSide: {flex: 1, alignItems: 'flex-end', gap: 5},
  rateLab: {fontSize: 11, fontWeight: '700', color: C.textMid},
  inputRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14},
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 90,
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingTop: 10,
    fontSize: 13,
    color: C.textDark,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.oceanMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: {opacity: 0.4},
  cRow: {flexDirection: 'row', gap: 10, marginTop: 14},
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(27,107,123,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {fontSize: 11.5, fontWeight: '800', color: C.oceanMid},
  cName: {fontSize: 12.5, fontWeight: '800', color: C.textDark},
  cTxt: {fontSize: 12.5, color: C.textMid, marginTop: 2, lineHeight: 18},
  none: {fontSize: 12, color: C.textLight, marginTop: 12, fontStyle: 'italic'},
});

export default ReviewsSection;
