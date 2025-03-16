import React, {useState} from 'react';
import {ImageBackground, TouchableOpacity, View} from 'react-native';
import {FTP_PATH} from '@env';
import styles from './Styles';
import GlobalText from '../Customs/Text';
import Octicons from 'react-native-vector-icons/Octicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PackageCard = ({data, cardType, onClick, reload}) => {
  const [rating, setRating] = useState(data?.rating_avg_rate || 0);
  const [isFav, setIsFav] = useState(data?.is_favorite);

  return (
    <TouchableOpacity
      style={
        cardType === 'small' ? styles.packageCardSmall : styles.packageCardLong
      }
      onPress={() => onClick()}>
      <View
        style={
          cardType === 'small'
            ? styles.smallPackageImage
            : styles.smallPackageImageLong
        }>
        {data.image || data.gallery?.[0] ? (
          <ImageBackground
            source={{
              uri: FTP_PATH + (data.image || data.gallery?.[0]?.path),
            }}
            imageStyle={
              cardType === 'small'
                ? styles.smallPackageImageStyle
                : styles.smallPackageImageLongStyle
            }
            resizeMode="cover"
          />
        ) : (
          <ImageBackground
            source={require('../../Assets/Images/no-image.png')}
            // style={cardType == 'small' ? styles.smallPackageImage : styles.placeImage}
            imageStyle={
              cardType == 'small'
                ? styles.smallPackageImageStyle
                : styles.smallPackageImageLongStyle
            }
            resizeMode="cover"
          />
        )}
      </View>

      {cardType === 'small' && (
        <View style={styles.packageLikeView}>
          <TouchableOpacity
            style={styles.citySmallLikeView}
            // onPress={() => setIsFav(!isFav)}
          >
            <Octicons
              name={isFav ? 'heart-fill' : 'heart'}
              color={isFav ? COLOR.red : COLOR.black}
              size={DIMENSIONS.iconSize}
            />
          </TouchableOpacity>
        </View>
      )}

      <View
        style={
          cardType === 'small'
            ? styles.packageCardContent
            : styles.packageCardContentLong
        }>
        <View>
          <GlobalText
            text={data.name}
            style={cardType === 'small' ? styles.boldText : styles.boldTextLong}
          />
          {cardType === 'small' ? (
            <GlobalText
              text={`${data?.tag_line}`}
              style={styles.greyText}
            />
          ) : (
            <View
              style={
                cardType === 'small'
                  ? styles.flexRowSmall
                  : styles.flexRowSmallLong
              }>
              <MaterialIcons
                name="location-pin"
                color={COLOR.grey}
                size={DIMENSIONS.smallIcon}
              />
              <GlobalText text={data?.site?.name} style={styles.greyTextLong} />
            </View>
          )}
        </View>
        <View
          style={
            cardType === 'small' ? styles.lastContent : styles.lastContentLong
          }>
          <View style={styles.flexRowSmall}>
            <Octicons
              name="star"
              color={COLOR.yellow}
              size={DIMENSIONS.iconSize}
            />
            <GlobalText text={rating} style={{marginLeft: 5}} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PackageCard;
