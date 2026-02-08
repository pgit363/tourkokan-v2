import React from 'react';
import {View, ScrollView} from 'react-native';
import {Skeleton} from '@rneui/themed';
import PackageCardSkeleton from '../Cards/PackageCardSkeleton';

const TrendingSkeleton = () => {
  return (
    <View style={{width: '100%'}}>
      {/* Tabs Skeleton */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 10}}
        style={{marginBottom: 10}}>
        {[1, 2, 3, 4].map((item, index) => (
          <View
            key={index}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 15,
              marginRight: 5,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Skeleton circle width={14} height={14} style={{marginRight: 8}} animation="pulse" />
            <Skeleton width={60} height={14} animation="pulse" />
          </View>
        ))}
      </ScrollView>

      {/* Cards Skeleton */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 5, paddingBottom: 10}}>
        {[1, 2, 3].map((item, index) => (
          <PackageCardSkeleton key={index} cardType={'small'} />
        ))}
      </ScrollView>
    </View>
  );
};

export default TrendingSkeleton;