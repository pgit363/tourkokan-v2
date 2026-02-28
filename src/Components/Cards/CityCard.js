import React, {useEffect, useState} from 'react';
import {View, ImageBackground, TouchableOpacity} from 'react-native';
import styles from './Styles';
import GlobalText from '../Customs/Text';
import ComingSoon from '../Common/ComingSoon';
import Octicons from 'react-native-vector-icons/Octicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import StarRating from 'react-native-star-rating-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {comnPost} from '../../Services/Api/CommonServices';
import {useTranslation} from 'react-i18next';
import {FTP_PATH} from '@env';

const CityCard = ({data, reload, onClick, setLoader = () => {}}) => {
  const {t} = useTranslation();

  const [isVisible] = useState(false);
  const [isFav, setIsFav] = useState(data?.is_favorite);
  const [rating, setRating] = useState(data?.rating_avg_rate || 0);
  const [commentCount] = useState(data?.comment_count || 0);
  const [rate, setRate] = useState(data?.rate?.rate || 0);
  const [cardType] = useState(data.category?.code);

  const cardStyle = cardType === 'city' ? styles.cityCard : styles.placeCard;
  const imageStyle = cardType === 'city' ? styles.cityImage : styles.placeImage;
  const starViewStyle =
    cardType === 'city' ? styles.cityStarView : styles.placeStarView;
  const detailsOverlayStyle =
    cardType === 'city' ? styles.cityDetailsOverlay : styles.placeDetailsOverlay;
  const alignEndStyle = {alignItems: 'flex-end'};
  const detailsHeaderStyle = {flexDirection: 'row', justifyContent: 'space-between'};

  useEffect(() => {
    setRating(data?.rating_avg_rate || 0);
  }, [data?.rating_avg_rate]);

  const onHeartClick = async () => {
    const placeData = {
      user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
      favouritable_type: t('TABLE.SITE'),
      favouritable_id: data.id,
    };
    setIsFav(!isFav);
    comnPost('v2/addDeleteFavourite', placeData)
      .then(res => {
        AsyncStorage.setItem('isUpdated', 'true');
        setLoader(false);
        reload();
      })
      .catch(() => {});
  };

  const onStarRatingPress = async nextRate => {
    setRate(nextRate);
    const placeData = {
      user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
      rateable_type: t('TABLE.SITE'),
      rateable_id: data.id,
      rate: nextRate,
    };
    comnPost('v2/addUpdateRating', placeData)
      .then(res => {
        AsyncStorage.setItem('isUpdated', 'true');
        setLoader(false);
        reload();
      })
      .catch(() => {});
  };

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => onClick()}>
      <View style={styles.cityOverlay} />
      {data.image ? (
        <ImageBackground
          source={{uri: FTP_PATH + data.image}}
          style={imageStyle}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        />
      ) : (
        <ImageBackground
          source={require('../../Assets/Images/no-image.png')}
          style={imageStyle}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        />
      )}
      <View style={alignEndStyle}>
        <TouchableOpacity
          style={styles.cityLikeView}
          onPress={() => onHeartClick()}>
          <Octicons
            name={isFav ? 'heart-fill' : 'heart'}
            color={isFav ? COLOR.red : COLOR.black}
            size={DIMENSIONS.iconSize}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cityLikeView}>
          <GlobalText text={commentCount} style={styles.commentCount} />
          <Octicons
            name="comment"
            color={COLOR.black}
            size={DIMENSIONS.iconSize}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cityLikeView}>
          {rating > 0 && (
            <GlobalText text={rating.slice(0, 3)} style={styles.avgRating} />
          )}
          <Octicons
            name="star"
            color={COLOR.yellow}
            size={DIMENSIONS.iconSize}
          />
        </TouchableOpacity>
      </View>

      <View style={starViewStyle}>
        <StarRating
          rating={rate}
          onChange={onStarRatingPress}
          starSize={17}
          style={styles.starStyle}
        />
      </View>

      <View style={detailsOverlayStyle}>
        <View style={detailsHeaderStyle}>
          <GlobalText text={data.name} style={styles.cityName} />
          <View>
            <GlobalText text={data.latitude} />
            <GlobalText text={data.longitude} />
          </View>
        </View>
        <View>
          <GlobalText
            text={`${
              data.description !== undefined
                ? data.description.slice(0, 80) + '...'
                : ''
            }`}
          />
          <GlobalText text={data.tag_line} style={styles.boldText} />
        </View>
      </View>
      <ComingSoon message={t('COMING_SOON')} visible={isVisible} />
    </TouchableOpacity>
  );
};

export default CityCard;
