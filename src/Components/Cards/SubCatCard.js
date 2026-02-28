import React from 'react';
import {TouchableOpacity} from 'react-native';
import styles from './Styles';
import GlobalText from '../Customs/Text';

const SubCatCard = ({data, onClick}) => {
  return (
    <TouchableOpacity style={styles.subCatCard} onPress={() => onClick()}>
      <GlobalText text={data.name} />
    </TouchableOpacity>
  );
};

export default SubCatCard;
