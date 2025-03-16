import React, {useState, useEffect} from 'react';
import {
  FlatList,
  View,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import GlobalText from '../Customs/Text';
import styles from './Styles';
import {Comment} from '../../Services/Constants/FIELDS';
import TextField from '../Customs/TextField';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import ImageButton from '../Customs/Buttons/ImageButton';
import {comnPost} from '../../Services/Api/CommonServices';
import Loader from '../Customs/Loader';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import COLOR from '../../Services/Constants/COLORS';
import {connect} from 'react-redux';
import {setLoader} from '../../Reducers/CommonActions';
import {useTranslation} from 'react-i18next';

const CommentsSheet = ({
  openCommentsSheet,
  closeCommentsSheet,
  reload,
  key,
  commentable_id,
  commentable_type,
  ...props
}) => {
  const {t} = useTranslation();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getComments();
  }, []);

  const getComments = () => {
    props.setLoader(true);
    const data = {
      commentable_type,
      commentable_id,
    };
    comnPost(`v2/comments?per_page=10&page=${page}`, data)
      .then(res => {
        setComments(res.data.data.data);
        props.setLoader(false);
      })
      .catch(err => {
        props.setLoader(false);
      });
  };

  const addComment = () => {
    // if (newComment.trim() !== '') {
    //     setComments([...comments, { id: comments.length + 1, text: newComment }]);
    //     setNewComment('');
    // }
    props.setLoader(true);
    const newData = {
      comment: newComment,
      commentable_type: t('TABLE.SITE'),
      commentable_id,
    };
    comnPost('v2/comment', newData)
      .then(res => {
        getComments();
        setNewComment('');
        props.setLoader(false);
      })
      .catch(err => {
        props.setLoader(false);
      });
  };

  const deleteComment = id => {
    props.setLoader(true);
    const data = {
      id,
    };
    comnPost('v2/deleteComment', data)
      .then(res => {
        getComments();
        props.setLoader(false);
      })
      .catch(err => {
        props.setLoader(false);
      });
  };

  const renderComments = ({item}) => {
    return (
      <View>
        <View
          style={{
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <View style={{top: 8}}>
            <ImageButton
              key={item.id}
              image={item.users?.profile_picture}
              imageButtonCircle={styles.commentUser}
              buttonIcon={styles.commentUserIcon}
            />
          </View>
          <View>
            <GlobalText
              text={item.users?.name}
              style={styles.commentUserName}
            />
            <GlobalText text={item.comment} style={styles.userComment} />
          </View>
          {/* <FlatList
                    data={item.comments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderSubComments}
                /> */}
        </View>
        <View style={{paddingHorizontal: 10, flexDirection: 'row'}}>
          <TouchableOpacity onPress={() => deleteComment(item.id)}>
            <GlobalText text={'Delete'} style={styles.deleteComment} />
          </TouchableOpacity>
          {/* <TouchableOpacity>
                        <GlobalText text={"Edit"} style={styles.deleteComment} />
                    </TouchableOpacity> */}
        </View>
      </View>
    );
  };

  const renderSubComments = ({item}) => {
    return (
      <View style={{padding: 10}}>
        <GlobalText text={item.comment} style={{textAlign: 'left'}} />
      </View>
    );
  };

  const setComment = val => {
    setNewComment(val);
    if (val != null || val != '') setIsActive(true);
    else setIsActive(false);
  };

  return (
    <KeyboardAvoidingView style={{zIndex: 100, position: 'relative'}}>
      <Loader />
      <View>
        <View style={styles.commentsHeader}>
          <GlobalText text={t('HEADER.COMMENTS')} style={styles.fontBold} />
        </View>
      </View>
      <View style={{overflowY: 'scroll', zIndex: 100}}>
        {comments ? (
          <FlatList
            nestedScrollEnabled={true}
            data={comments}
            keyExtractor={item => item.id.toString()}
            renderItem={renderComments}
          />
        ) : (
          <View style={[styles.noComments, {flex: 1}]}>
            <GlobalText text={t('NO_COMMENTS')} style={styles.fontBold} />
            <GlobalText text={t('START_CONVO')} />
          </View>
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.commentInputBox}>
          {Comment.map((field, index) => (
            <TextField
              key={index}
              name={field.name}
              label={field.name}
              placeholder={field.placeholder}
              fieldType={field.type}
              length={field.length}
              required={field.required}
              disabled={
                index === 1 && (source?.name === '' || source?.name === null)
              }
              value={newComment}
              setChild={val => setComment(val)}
              style={styles.routesSearchPanelField}
              containerStyle={styles.commentTextContainerStyle}
              inputContainerStyle={styles.commentInputContainerStyle}
              rightIcon={
                <FontAwesome
                  style={styles.sendIcon}
                  name="send"
                  color={isActive ? COLOR.themeBlue : COLOR.grey}
                  size={DIMENSIONS.iconBig}
                  onPress={isActive ? addComment : null}
                />
              }
            />
          ))}
        </KeyboardAvoidingView>
      </View>
    </KeyboardAvoidingView>
  );
};

const mapStateToProps = state => {
  return {
    access_token: state.commonState.access_token,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setLoader: data => {
      dispatch(setLoader(data));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CommentsSheet);
