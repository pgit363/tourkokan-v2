import React, {useEffect, useState} from 'react';
import {View, ImageBackground, TouchableOpacity} from 'react-native';
import styles from './Styles';
import GlobalText from '../Customs/Text';
import ComingSoon from '../Common/ComingSoon';
import Octicons from 'react-native-vector-icons/Octicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import StarRating from 'react-native-star-rating-widget'; // Updated import
import AsyncStorage from '@react-native-async-storage/async-storage';
import {comnPost} from '../../Services/Api/CommonServices';
import {useTranslation} from 'react-i18next';
import {FTP_PATH} from '@env';

const CityCardSmall = ({data, reload, navigation, addComment, onClick}) => {
  const {t} = useTranslation();

  const [isVisible] = useState(false);
  const [isFav, setIsFav] = useState(data?.is_favorite);
  const [rating, setRating] = useState(data?.rating_avg_rate || 0);
  const [commentCount] = useState(data?.comment_count || 0);
  const [cardType] = useState('city');
  const likeHeaderStyle = {alignItems: 'flex-end'};

  useEffect(() => {
    setRating(data?.rating_avg_rate || 0);
  }, [data]);

  const onHeartClick = async () => {
    let placeData = {
      user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
      favouritable_type: t('TABLE.SITE'),
      favouritable_id: data.id,
    };
    setIsFav(!isFav);
    comnPost('v2/addDeleteFavourite', placeData)
      .then(res => {
        AsyncStorage.setItem('isUpdated', 'true');
        reload();
      })
      .catch(() => {});
  };

  const onStarRatingPress = async rate => {
    // setRating(rate);
    // const placeData = {
    //   user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
    //   rateable_type: t('TABLE.SITE'),
    //   rateable_id: data.id,
    //   rate,
    // };
    // comnPost('v2/addUpdateRating', placeData)
    //   .then(res => {
    //     AsyncStorage.setItem('isUpdated', 'true');
    //     reload();
    //   })
    //   .catch(err => {});
  };

  return (
    <TouchableOpacity
      style={cardType === 'city' ? styles.cityCardSmall : styles.placeCardSmall}
      onPress={() => onClick()}>
      <View style={styles.cityOverlay} />
      {data.image ? (
        <ImageBackground
          source={{uri: FTP_PATH + data.image}}
          style={cardType === 'city' ? styles.citySmallImage : styles.placeImage}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        />
      ) : data.gallery && data?.gallery[0] ? (
        <ImageBackground
          source={{uri: FTP_PATH + data.gallery[0].path}}
          style={cardType === 'city' ? styles.citySmallImage : styles.placeImage}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        />
      ) : (
        <ImageBackground
          source={require('../../Assets/Images/no-image.png')}
          style={cardType === 'city' ? styles.citySmallImage : styles.placeImage}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        />
      )}
      <View style={likeHeaderStyle}>
        <TouchableOpacity
          style={styles.citySmallLikeView}
          onPress={() => onHeartClick()}
        >
          <Octicons
            name={isFav ? 'heart-fill' : 'heart'}
            color={isFav ? COLOR.red : COLOR.black}
            size={DIMENSIONS.iconSize}
          />
        </TouchableOpacity>
        <View style={styles.citySmallLikeView}>
          <GlobalText text={commentCount} style={styles.commentCount} />
          <Octicons
            name="comment"
            color={COLOR.black}
            size={DIMENSIONS.iconSize}
          />
        </View>
      </View>

      <View
          style={
            cardType === 'city'
              ? styles.citySmallDetailsOverlay
              : styles.placeDetailsOverlay
          }>
        <View>
          <GlobalText text={data.name} style={styles.citySmallName} />
          <GlobalText
            text={`${data.tag_line ? data.tag_line?.slice(0, 50) : ''}${
              data.tag_line?.length > 50 ? '...' : ''
            }`}
            style={styles.citySmallTagLine}
          />
        </View>
        <View
          style={
            cardType === 'city' ? styles.citySmallStarView : styles.placeStarView
          }>
          <StarRating
            rating={rating}
            onChange={onStarRatingPress}
            starSize={14}
            starStyle={styles.starStyle}
          />
        </View>
      </View>
      <ComingSoon message={t('COMING_SOON')} visible={isVisible} />
    </TouchableOpacity>
  );
};

export default CityCardSmall;
