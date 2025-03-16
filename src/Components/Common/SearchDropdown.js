import React from 'react';
import {FlatList, KeyboardAvoidingView, ScrollView} from 'react-native';
import {ListItem} from '@rneui/themed';
import styles from './Styles';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR from '../../Services/Constants/COLORS';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';

const SearchDropdown = ({
  placesList,
  goToNext,
  setPlace,
  closeDropdown,
  style,
  height,
}) => {
  const renderItem = ({item}) => {
    return (
      <ListItem bottomDivider onPress={() => setPlace(item)}>
        <ListItem.Content>
          <ListItem.Title>{item.name}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  return (
    <ScrollView
      behavior="height"
      nestedScrollEnabled
      style={[styles.searchDropView, style]}>
      <Ionicons
        style={styles.dropCloseIcon}
        name="close-circle"
        color={COLOR.themeBlue}
        size={DIMENSIONS.iconLarge}
        onPress={closeDropdown}
      />
      <FlatList
        keyExtractor={item => item.id}
        data={placesList}
        renderItem={renderItem}
        // onEndReached={goToNext}
        nestedScrollEnabled
        style={{marginBottom: 20, overflow: 'scroll', height}}
      />
    </ScrollView>
  );
};

export default SearchDropdown;
