import React from 'react';
import {View, ScrollView} from 'react-native';
import {Skeleton} from '@rneui/themed';
import PackageCardSkeleton from '../Cards/PackageCardSkeleton';

const TrendingSkeleton = () => {
  const containerStyle = {width: '100%'};
  const tabsContentStyle = {paddingHorizontal: 10};
  const tabsScrollStyle = {marginBottom: 10};
  const tabItemStyle = {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
  };
  const tabIconStyle = {marginRight: 8};
  const cardsContentStyle = {paddingHorizontal: 5, paddingBottom: 10};

  return (
    <View style={containerStyle}>
      {/* Tabs Skeleton */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabsContentStyle}
        style={tabsScrollStyle}>
        {[1, 2, 3, 4].map((item, index) => (
          <View key={index} style={tabItemStyle}>
            <Skeleton
              circle
              width={14}
              height={14}
              style={tabIconStyle}
              animation="pulse"
            />
            <Skeleton width={60} height={14} animation="pulse" />
          </View>
        ))}
      </ScrollView>

      {/* Cards Skeleton */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={cardsContentStyle}>
        {[1, 2, 3].map((item, index) => (
          <PackageCardSkeleton key={index} cardType={'small'} />
        ))}
      </ScrollView>
    </View>
  );
};

export default TrendingSkeleton;
