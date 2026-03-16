import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import {FTP_PATH} from '@env';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {comnPost} from '../../Services/Api/CommonServices';
import {setLoader} from '../../Reducers/CommonActions';

const C = {
  oceanDeep: '#0D3D4A', oceanMid: '#1B6B7B', oceanFoam: '#B8E4EA',
  cream: '#FAF7F0', white: '#FFFFFF',
  textDark: '#1C1917', textMid: '#44403C', textLight: '#78716C',
};

const CommentsSheet = ({
  openCommentsSheet,
  closeCommentsSheet,
  reload,
  commentable_id,
  commentable_type,
}) => {
  const {t} = useTranslation();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getComments();
  }, []);

  const getComments = () => {
    setLoading(true);
    comnPost('v2/comments?per_page=20&page=1', {commentable_type, commentable_id})
      .then(res => {
        setComments(res?.data?.data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const addComment = () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    comnPost('v2/comment', {
      comment: newComment,
      commentable_type: t('TABLE.SITE'),
      commentable_id,
    })
      .then(() => {
        setNewComment('');
        getComments();
        reload?.();
        setSubmitting(false);
      })
      .catch(() => setSubmitting(false));
  };

  const deleteComment = id => {
    comnPost('v2/deleteComment', {id})
      .then(() => {
        getComments();
        reload?.();
      })
      .catch(() => {});
  };

  const getUserInitials = user => {
    if (!user?.name) return '?';
    return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderComment = ({item}) => {
    // users can be array (getSite API) or object (comments API); item.user is a fallback key
    const raw = item.users ?? item.user;
    const user = Array.isArray(raw) ? raw[0] : raw;
    return (
      <View style={cs.commentRow}>
        <View style={cs.avatarWrap}>
          {user?.profile_picture ? (
            <Image
              source={{uri: `${FTP_PATH}${user.profile_picture}`}}
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
              <View style={cs.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={11} color={C.oceanMid} />
                <Text style={cs.verifiedText}>Verified</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => deleteComment(item.id)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons name="trash-outline" size={14} color="#E57373" />
            </TouchableOpacity>
          </View>
          <Text style={cs.commentText}>{item.comment}</Text>
        </View>
      </View>
    );
  };

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

      {/* Input row */}
      <View style={cs.inputRow}>
        <TextInput
          style={cs.input}
          placeholder="Share your experience…"
          placeholderTextColor={C.textLight}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[cs.sendBtn, (!newComment.trim() || submitting) && cs.sendBtnDisabled]}
          onPress={addComment}
          disabled={!newComment.trim() || submitting}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <Ionicons name="send" size={18} color={C.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const cs = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.cream},

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
    backgroundColor: C.white,
  },
  headerDot: {width: 4, height: 18, borderRadius: 2, backgroundColor: C.oceanMid},
  headerTitle: {flex: 1, fontSize: 16, fontWeight: '700', color: C.textDark},

  // States
  loadingWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  loadingText: {fontSize: 13, color: C.textLight},
  emptyWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40},
  emptyIcon: {fontSize: 42, marginBottom: 12, opacity: 0.4},
  emptyTitle: {fontSize: 14, fontWeight: '600', color: C.textMid, marginBottom: 4},
  emptySubText: {fontSize: 12, color: C.textLight},

  // List
  list: {flex: 1},
  listContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},

  // Comment row
  commentRow: {flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start'},
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
  commentNameRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  commentName: {fontSize: 13, fontWeight: '700', color: C.textDark},
  verifiedBadge: {flexDirection: 'row', alignItems: 'center', gap: 3},
  verifiedText: {fontSize: 10, color: C.oceanMid, fontWeight: '600'},
  commentText: {fontSize: 13, lineHeight: 19, color: C.textMid},

  // Input
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
});

const mapStateToProps = state => ({access_token: state.commonState.access_token});
const mapDispatchToProps = dispatch => ({setLoader: data => dispatch(setLoader(data))});

export default connect(mapStateToProps, mapDispatchToProps)(CommentsSheet);
