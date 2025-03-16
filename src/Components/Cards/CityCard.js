import React, {useEffect, useState} from 'react';
import {View, ImageBackground, TouchableOpacity, Share} from 'react-native';
import styles from './Styles';
import Path from '../../Services/Api/BaseUrl';
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

const CityCard = ({data, reload, navigation, addComment, onClick}) => {
  const {t} = useTranslation();

  const [isVisible, setIsVisible] = useState(false);
  const [isFav, setIsFav] = useState(data?.is_favorite);
  const [rating, setRating] = useState(data?.rating_avg_rate || 0);
  const [commentCount, setCommentCount] = useState(data?.comment_count || 0);
  const [rate, setRate] = useState(data?.rate?.rate || 0);
  const [cardType, setCardType] = useState(data.category?.code);

  useEffect(() => {
    setRating(data?.rating_avg_rate || 0);
  }, [rate]);

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
        props.setLoader(false);
        reload();
      })
      .catch(err => {});
  };

  const onShareClick = async () => {
    try {
      const deepLink = `awesomeapp://citydetails?id=${data.id}`; // Replace with your custom scheme and path
      const shareMessage = `Explore the details of this amazing city in TourKokan! 🌍🏙️ Check out what makes it unique and discover more about its culture, attractions, and hidden gems. Open the link to dive into the City Details now! 📱👀`;
      const shareUrl = deepLink;
      const result = await Share.share({
        message: shareMessage,
        url: shareUrl,
      });

      if (result.action === Share.sharedAction) {
        console.log('Content shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing content:', error.message);
    }
  };

  const onStarRatingPress = async rate => {
    setRate(rate);
    const placeData = {
      user_id: await AsyncStorage.getItem(t('STORAGE.USER_ID')),
      rateable_type: t('TABLE.SITE'),
      rateable_id: data.id,
      rate,
    };
    comnPost('v2/addUpdateRating', placeData)
      .then(res => {
        AsyncStorage.setItem('isUpdated', 'true');
        props.setLoader(false);
        reload();
      })
      .catch(err => {});
  };

  return (
    <TouchableOpacity
      style={cardType == 'city' ? styles.cityCard : styles.placeCard}
      onPress={() => onClick()}>
      <View style={styles.cityOverlay} />
      {data.image ? (
        <ImageBackground
          source={{uri: FTP_PATH + data.image}}
          style={cardType == 'city' ? styles.cityImage : styles.placeImage}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        />
      ) : (
        <ImageBackground
          source={require('../../Assets/Images/no-image.png')}
          style={cardType == 'city' ? styles.cityImage : styles.placeImage}
          imageStyle={styles.cityImageStyle}
          resizeMode="cover"
        />
      )}
      <View style={{alignItems: 'flex-end'}}>
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

      <View
        style={cardType == 'city' ? styles.cityStarView : styles.placeStarView}>
        <StarRating
          rating={rate}
          onChange={onStarRatingPress}
          starSize={17}
          style={styles.starStyle}
        />
      </View>

      <View
        style={
          cardType == 'city'
            ? styles.cityDetailsOverlay
            : styles.placeDetailsOverlay
        }>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <GlobalText text={data.name} style={styles.cityName} />
          <View>
            <GlobalText text={data.latitude} />
            <GlobalText text={data.longitude} />
          </View>
        </View>
        <View>
          <GlobalText
            text={`${
              data.description != undefined
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
