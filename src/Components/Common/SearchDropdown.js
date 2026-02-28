import React from 'react';
import {FlatList, View} from 'react-native';
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
      <ListItem
        bottomDivider
        onPress={() => setPlace(item)}>
        <ListItem.Content>
          <ListItem.Title>{item.name}</ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };
  const listWrapStyle = {marginBottom: 20};
  const dropdownStyle = [
    styles.searchDropView,
    height ? {maxHeight: height} : null,
    style,
  ];

  return (
    <FlatList
      nestedScrollEnabled
      style={dropdownStyle}
      data={placesList ?? []}
      keyExtractor={(item, index) => `${item?.id ?? item?.name ?? index}`}
      renderItem={renderItem}
      onEndReached={goToNext}
      onEndReachedThreshold={0.6}
      ListHeaderComponent={
        <Ionicons
          style={styles.dropCloseIcon}
          name="close-circle"
          color={COLOR.themeBlue}
          size={DIMENSIONS.iconLarge}
          onPress={closeDropdown}
        />
      }
      ListFooterComponent={<View style={listWrapStyle} />}
    />
  );
};

export default SearchDropdown;
