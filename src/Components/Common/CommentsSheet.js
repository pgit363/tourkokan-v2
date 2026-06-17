import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AWS_URL} from '@env';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {comnPost} from '../../Services/Api/CommonServices';
import {setLoader} from '../../Reducers/CommonActions';
import {isGuestUser} from './GuestGateModal';
import GuestGateModal from './GuestGateModal';
import STRING from '../../Services/Constants/STRINGS';
import {scaleFontSizes} from '../../Services/responsive';

const C = {
  oceanDeep: '#0D3D4A', oceanMid: '#1B6B7B', oceanFoam: '#B8E4EA',
  cream: '#FAF7F0', white: '#FFFFFF',
  textDark: '#1C1917', textMid: '#44403C', textLight: '#78716C',
  danger: '#E57373', successBg: '#E8F5E9', successText: '#2E7D32',
};

const CommentsSheet = ({
  closeCommentsSheet,
  reload,
  commentable_id,
  commentable_type,
  navigation,
}) => {
  const {t} = useTranslation();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // {id, name}
  const [editMode, setEditMode] = useState(null); // {id, text}
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  const [toast, setToast] = useState(null); // {msg, type: 'success'|'info'}
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STRING.STORAGE.USER_ID).then(id => {
      if (id) setCurrentUserId(parseInt(id, 10));
    });
    getComments();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({msg, type});
    Animated.sequence([
      Animated.timing(toastOpacity, {toValue: 1, duration: 250, useNativeDriver: true}),
      Animated.delay(2500),
      Animated.timing(toastOpacity, {toValue: 0, duration: 300, useNativeDriver: true}),
    ]).start(() => setToast(null));
  };

  const getComments = () => {
    setLoading(true);
    comnPost('v2/comments?per_page=20&page=1', {commentable_type, commentable_id})
      .then(res => {
        setComments(res?.data?.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const addComment = async () => {
    const text = newComment.trim();
    if (!text || submitting) return;

    const guest = await isGuestUser();
    if (guest) {
      setGuestModalVisible(true);
      return;
    }

    setSubmitting(true);
    const payload = {
      comment: text,
      commentable_type,
      commentable_id,
    };
    if (replyTo) payload.parent_id = replyTo.id;

    comnPost('v2/comment', payload)
      .then(() => {
        setNewComment('');
        setReplyTo(null);
        getComments();
        reload?.();
        setSubmitting(false);
        showToast('Comment submitted and awaiting approval.');
      })
      .catch(() => setSubmitting(false));
  };

  const saveEdit = async () => {
    if (!editMode?.text?.trim() || submitting) return;
    setSubmitting(true);
    const res = await comnPost('v2/updateComment', {id: editMode.id, comment: editMode.text.trim()});
    setSubmitting(false);
    const resData = res?.data ?? res?.response?.data;
    if (resData?.success) {
      setEditMode(null);
      getComments();
      reload?.();
      showToast('Comment updated.');
    } else {
      const msg = resData?.message;
      const displayMsg = typeof msg === 'string' ? msg
        : typeof msg === 'object' && msg !== null ? Object.values(msg).flat().join('\n')
        : 'Failed to update comment.';
      showToast(displayMsg, 'error');
    }
  };

  const deleteComment = async id => {
    const res = await comnPost('v2/deleteComment', {id});
    const resData = res?.data ?? res?.response?.data;
    if (resData?.success) {
      getComments();
      reload?.();
    }
  };

  const handleGuestLogin = async () => {
    setGuestModalVisible(false);
    await AsyncStorage.clear();
    await AsyncStorage.setItem('IS_FIRST_TIME', 'false');
    if (navigation) {
      navigation.reset({index: 0, routes: [{name: STRING.SCREEN.EMAIL}]});
    }
  };

  const getUserInitials = user => {
    if (!user?.name) return '?';
    return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwn = item => {
    const raw = item.users ?? item.user;
    const user = Array.isArray(raw) ? raw[0] : raw;
    return currentUserId && parseInt(user?.id, 10) === currentUserId;
  };

  const renderComment = ({item}) => {
    const raw = item.users ?? item.user;
    const user = Array.isArray(raw) ? raw[0] : raw;
    const own = isOwn(item);
    const isReply = !!item.parent_id;

    return (
      <View style={[cs.commentRow, isReply && cs.commentRowReply]}>
        {isReply && <View style={cs.replyLine} />}
        <View style={cs.avatarWrap}>
          {user?.profile_picture ? (
            <Image
              source={{uri: user.profile_picture.startsWith('http') ? user.profile_picture : `${AWS_URL}${user.profile_picture}`}}
              style={cs.avatar}
            />
          ) : (
            <View style={cs.avatarFallback}>
              <Text style={cs.avatarInitials}>{getUserInitials(user)}</Text>
            </View>
          )}
        </View>
        <View style={cs.commentBubble}>
          <View style={cs.commentTop}>
            <View style={cs.commentNameRow}>
              <Text style={cs.commentName}>{user?.name || 'Traveler'}</Text>
              {!isReply && (
                <View style={cs.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={11} color={C.oceanMid} />
                  <Text style={cs.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={cs.commentActions}>
              <TouchableOpacity
                onPress={() => {
                  setReplyTo({id: item.id, name: user?.name || 'Traveler'});
                  setEditMode(null);
                }}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                style={cs.actionBtn}>
                <Ionicons name="return-down-forward-outline" size={14} color={C.oceanMid} />
              </TouchableOpacity>
              {own && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setEditMode({id: item.id, text: item.comment});
                      setReplyTo(null);
                    }}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    style={cs.actionBtn}>
                    <Ionicons name="pencil-outline" size={14} color={C.oceanMid} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteComment(item.id)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                    style={cs.actionBtn}>
                    <Ionicons name="trash-outline" size={14} color={C.danger} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          <Text style={cs.commentText}>{item.comment}</Text>
        </View>
      </View>
    );
  };

  const inputPlaceholder = replyTo
    ? `Replying to ${replyTo.name}…`
    : editMode
    ? 'Edit your comment…'
    : 'Share your experience…';

  const currentInputText = editMode ? editMode.text : newComment;
  const onChangeText = text => {
    if (editMode) setEditMode(prev => ({...prev, text}));
    else setNewComment(text);
  };
  const onSend = editMode ? saveEdit : addComment;
  const canSend = currentInputText.trim().length > 0 && !submitting;

  return (
    <KeyboardAvoidingView
      style={cs.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={20}>

      {/* Header */}
      <View style={cs.header}>
        <View style={cs.headerDot} />
        <Text style={cs.headerTitle}>{t('HEADER.COMMENTS')}</Text>
        <TouchableOpacity
          onPress={closeCommentsSheet}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Ionicons name="close" size={22} color={C.textLight} />
        </TouchableOpacity>
      </View>

      {/* Toast */}
      {toast && (
        <Animated.View style={[cs.toast, toast.type === 'error' && cs.toastError, {opacity: toastOpacity}]}>
          <Ionicons
            name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={15}
            color={toast.type === 'error' ? '#DC2626' : C.successText}
          />
          <Text style={[cs.toastText, toast.type === 'error' && cs.toastTextError]}>{toast.msg}</Text>
        </Animated.View>
      )}

      {/* Comments list */}
      {loading ? (
        <View style={cs.loadingWrap}>
          <ActivityIndicator color={C.oceanMid} size="large" />
          <Text style={cs.loadingText}>Loading reviews…</Text>
        </View>
      ) : comments?.length > 0 ? (
        <FlatList
          data={comments}
          keyExtractor={item => item.id.toString()}
          renderItem={renderComment}
          style={cs.list}
          contentContainerStyle={cs.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={cs.emptyWrap}>
          <Text style={cs.emptyIcon}>💬</Text>
          <Text style={cs.emptyTitle}>{t('NO_COMMENTS')}</Text>
          <Text style={cs.emptySubText}>{t('START_CONVO')}</Text>
        </View>
      )}

      {/* Reply/edit context banner */}
      {(replyTo || editMode) && (
        <View style={cs.contextBanner}>
          <Ionicons
            name={replyTo ? 'return-down-forward-outline' : 'pencil-outline'}
            size={14}
            color={C.oceanMid}
          />
          <Text style={cs.contextText}>
            {replyTo ? `Replying to ${replyTo.name}` : 'Editing comment'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setReplyTo(null);
              setEditMode(null);
            }}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Ionicons name="close-circle" size={16} color={C.textLight} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={cs.inputRow}>
        <TextInput
          style={cs.input}
          placeholder={inputPlaceholder}
          placeholderTextColor={C.textLight}
          value={currentInputText}
          onChangeText={onChangeText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[cs.sendBtn, !canSend && cs.sendBtnDisabled]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <Ionicons name={editMode ? 'checkmark' : 'send'} size={18} color={C.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Guest gate modal */}
      <GuestGateModal
        visible={guestModalVisible}
        message="Please login to post a comment."
        onClose={() => setGuestModalVisible(false)}
        onLogin={handleGuestLogin}
      />
    </KeyboardAvoidingView>
  );
};

const cs = StyleSheet.create(scaleFontSizes({
  container: {flex: 1, backgroundColor: C.cream},

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
    backgroundColor: C.white,
  },
  headerDot: {width: 4, height: 18, borderRadius: 2, backgroundColor: C.oceanMid},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', color: C.textDark},

  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    backgroundColor: C.successBg, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  toastError: {backgroundColor: '#FEE2E2'},
  toastText: {fontSize: 13, color: C.successText, flex: 1},
  toastTextError: {color: '#DC2626'},

  loadingWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  loadingText: {fontSize: 13, color: C.textLight},
  emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40},
  emptyIcon: {fontSize: 42, marginBottom: 12, opacity: 0.4},
  emptyTitle: {fontSize: 14, fontWeight: '600', color: C.textMid, marginBottom: 4},
  emptySubText: {fontSize: 12, color: C.textLight},

  list: {flex: 1},
  listContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},

  commentRow: {flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start'},
  commentRowReply: {marginLeft: 24, marginBottom: 8},
  replyLine: {
    position: 'absolute', left: -14, top: 0, bottom: 0,
    width: 2, backgroundColor: C.oceanFoam, borderRadius: 1,
  },
  avatarWrap: {flexShrink: 0, marginTop: 2},
  avatar: {width: 38, height: 38, borderRadius: 19},
  avatarFallback: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.oceanMid, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: {fontSize: 14, fontWeight: '700', color: C.white},
  commentBubble: {
    flex: 1, backgroundColor: C.white, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  commentTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 5,
  },
  commentNameRow: {flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1},
  commentName: {fontSize: 13, fontWeight: '700', color: C.textDark},
  verifiedBadge: {flexDirection: 'row', alignItems: 'center', gap: 3},
  verifiedText: {fontSize: 10, color: C.oceanMid, fontWeight: '600'},
  commentActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  actionBtn: {padding: 2},
  commentText: {fontSize: 13, lineHeight: 19, color: C.textMid},

  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#EEF6FF',
    borderTopWidth: 1, borderTopColor: 'rgba(27,107,123,0.12)',
  },
  contextText: {flex: 1, fontSize: 12, color: C.oceanMid, fontWeight: '500'},

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)',
    backgroundColor: C.white,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.cream, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(27,107,123,0.2)',
    fontSize: 14, color: C.textDark, lineHeight: 20,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.oceanMid, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: {backgroundColor: C.oceanFoam},
}));

const mapStateToProps = state => ({access_token: state.commonState.access_token});
const mapDispatchToProps = dispatch => ({setLoader: data => dispatch(setLoader(data))});

export default connect(mapStateToProps, mapDispatchToProps)(CommentsSheet);
