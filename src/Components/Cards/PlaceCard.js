import React, {useState} from 'react';
import {View, ImageBackground, TouchableOpacity} from 'react-native';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
import Octicons from 'react-native-vector-icons/Octicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import StarRating from 'react-native-star-rating-widget'; // Updated import
import {comnPost} from '../../Services/Api/CommonServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalText from '../Customs/Text';
import ComingSoon from '../Common/ComingSoon';
import {useTranslation} from 'react-i18next';
import {FTP_PATH} from '@env';

const PlaceCard = ({data, reload, navigation, addComment, onClick}) => {
  const {t} = useTranslation();

  const [isFav, setIsFav] = useState(data.is_favorite);
  const [isLiked, setIsLiked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState(data?.rating_avg_rate || 0);
  const [commentCount, setCommentCount] = useState(data?.comment_count || 0);
  const [rate, setRate] = useState(data?.rate?.rate || 0);
  const [cardType, setCardType] = useState(data.category?.code);

  const onHeartClick = async () => {
    let cityData = {
      user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
      favouritable_type: t('TABLE.SITES'),
      favouritable_id: data.id,
    };
    setIsFav(!isFav);
    comnPost('v2/addDeleteFavourite', cityData)
      .then(res => {
        AsyncStorage.setItem('isUpdated', 'true');
        reload();
      })
      .catch(err => {});
  };

  const onStarRatingPress = async rate => {
    setRating(rate);
    const placeData = {
      user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
      rateable_type: t('TABLE.SITE'),
      rateable_id: data.id,
      rate,
    };
    comnPost('v2/addUpdateRating', placeData)
      .then(res => {
        AsyncStorage.setItem('isUpdated', 'true');
        reload();
      })
      .catch(err => {});
  };

  const onLikeClick = () => {
    setIsLiked(!isLiked);
    // reload()
  };

  return (
    <View style={styles.placeContainer}>
      <TouchableOpacity style={styles.placeImageView} onPress={() => onClick()}>
        {data.image ? (
          <ImageBackground
            source={{uri: FTP_PATH + data.image}}
            style={styles.placeImage}
            imageStyle={styles.placeImageStyle}
            resizeMode="cover"
          />
        ) : (
          <ImageBackground
            source={require('../../Assets/Images/no-image.png')}
            style={styles.placeImage}
            imageStyle={styles.placeImageStyle}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
      <View style={styles.placeContentView}>
        <View style={styles.placeContentTop}>
          <TouchableOpacity onPress={() => onClick()}>
            <GlobalText text={data.name} style={styles.placeName} />
            <GlobalText text={data.tag_line} style={styles.placeTag} />
          </TouchableOpacity>
          <View style={styles.flexRowLike}>
            <View style={{width: '40%'}}>
              <StarRating
                rating={rating}
                onChange={onStarRatingPress}
                starSize={14}
                starStyle={styles.starStyle}
                enableHalfStar={true} // Optional, depending on your use case
              />
            </View>
            <View style={styles.flexColumn}>
              <View style={styles.citySmallLikeView}>
                <GlobalText text={commentCount} style={styles.commentCount} />
                <Octicons
                  name="comment"
                  color={COLOR.black}
                  size={DIMENSIONS.iconSize}
                />
              </View>
              <TouchableOpacity
                style={styles.likeView}
                onPress={() => onHeartClick()}>
                <Octicons
                  name={isFav ? 'heart-fill' : 'heart'}
                  color={isFav ? COLOR.red : COLOR.black}
                  size={DIMENSIONS.iconSize}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* <View style={styles.placeMetaView}>
          <View style={styles.splitView}>
            <GlobalText
              text={'Rs. 2500 for one'}
              style={styles.lightBlackText}
            />
          </View>
          <View style={styles.vertDivider}></View>
          <View style={styles.splitView}>
            <GlobalText text={'2 Km'} style={styles.lightBlackText} />
            <GlobalText text={'25 Min'} style={styles.lightBlackText} />
          </View>
        </View> */}
      </View>
      <ComingSoon message={t('COMING_SOON')} visible={isVisible} />
    </View>
  );
};

export default PlaceCard;
